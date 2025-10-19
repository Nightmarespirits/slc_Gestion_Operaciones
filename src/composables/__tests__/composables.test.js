import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useLazyLoading } from '../useLazyLoading.js'
import { useDebounce, useSearchDebounce } from '../useDebounce.js'
import { useInfiniteScroll } from '../useInfiniteScroll.js'
import { useVirtualization } from '../useVirtualization.js'

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

describe('Performance Composables', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('useLazyLoading', () => {
    it('should initialize with correct default state', () => {
      const { state, hasItems, isLoading, canLoadMore } = useLazyLoading()
      
      expect(state.items).toEqual([])
      expect(state.pagination.page).toBe(1)
      expect(state.pagination.limit).toBe(50)
      expect(hasItems.value).toBe(false)
      expect(isLoading.value).toBe(false)
      expect(canLoadMore.value).toBe(true)
    })

    it('should load initial data correctly', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        data: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }],
        total: 2
      })

      const { state, loadInitial, hasItems } = useLazyLoading({
        fetchFunction: mockFetch
      })

      await loadInitial()

      expect(mockFetch).toHaveBeenCalledWith({
        page: 1,
        limit: 50,
        search: '',
        sortBy: null,
        sortOrder: 'asc'
      })
      expect(state.items).toHaveLength(2)
      expect(hasItems.value).toBe(true)
    })

    it('should handle search correctly', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        data: [{ id: 1, name: 'Searched Item' }],
        total: 1
      })

      const { search, state } = useLazyLoading({
        fetchFunction: mockFetch
      })

      await search('test search')

      expect(state.filters.search).toBe('test search')
      expect(mockFetch).toHaveBeenCalledWith({
        page: 1,
        limit: 50,
        search: 'test search',
        sortBy: null,
        sortOrder: 'asc'
      })
    })
  })

  describe('useDebounce', () => {
    it('should debounce value changes', async () => {
      vi.useFakeTimers()
      
      const initialValue = ref('initial')
      const { debouncedValue, isDebouncing } = useDebounce(initialValue, 300)

      expect(debouncedValue.value).toBe('initial')
      expect(isDebouncing.value).toBe(false)

      initialValue.value = 'changed'
      expect(isDebouncing.value).toBe(true)
      expect(debouncedValue.value).toBe('initial') // Still old value

      vi.advanceTimersByTime(300)
      await nextTick()

      expect(debouncedValue.value).toBe('changed')
      expect(isDebouncing.value).toBe(false)

      vi.useRealTimers()
    })

    it('should cancel debounce correctly', async () => {
      vi.useFakeTimers()
      
      const initialValue = ref('initial')
      const { debouncedValue, cancel, isDebouncing } = useDebounce(initialValue, 300)

      initialValue.value = 'changed'
      expect(isDebouncing.value).toBe(true)

      cancel()
      expect(isDebouncing.value).toBe(false)

      vi.advanceTimersByTime(300)
      await nextTick()

      expect(debouncedValue.value).toBe('initial') // Should remain unchanged

      vi.useRealTimers()
    })
  })

  describe('useSearchDebounce', () => {
    it('should handle search with history', async () => {
      vi.useFakeTimers()
      
      const mockOnSearch = vi.fn()
      const { updateSearch, searchHistory, getSuggestions } = useSearchDebounce(
        ref(''),
        300,
        { onSearch: mockOnSearch }
      )

      updateSearch('test search')
      vi.advanceTimersByTime(300)
      await nextTick()

      expect(mockOnSearch).toHaveBeenCalledWith('test search')
      expect(searchHistory.value).toContain('test search')

      const suggestions = getSuggestions('test')
      expect(suggestions).toContain('test search')

      vi.useRealTimers()
    })
  })

  describe('useInfiniteScroll', () => {
    it('should initialize intersection observer', () => {
      const mockLoadMore = vi.fn()
      const { targetElement } = useInfiniteScroll({
        loadMoreFunction: mockLoadMore
      })

      // Simulate mounting
      targetElement.value = document.createElement('div')
      
      expect(global.IntersectionObserver).toHaveBeenCalled()
    })

    it('should handle loading states correctly', async () => {
      const mockLoadMore = vi.fn().mockResolvedValue()
      const { isLoading, forceLoadMore } = useInfiniteScroll({
        loadMoreFunction: mockLoadMore,
        canLoadMore: () => true
      })

      expect(isLoading.value).toBe(false)

      const loadPromise = forceLoadMore()
      expect(isLoading.value).toBe(true)

      await loadPromise
      expect(isLoading.value).toBe(false)
      expect(mockLoadMore).toHaveBeenCalled()
    })
  })

  describe('useVirtualization', () => {
    it('should calculate visible items correctly', () => {
      const { items, visibleItems, getStartIndex, getEndIndex } = useVirtualization({
        itemHeight: 50,
        containerHeight: 400
      })

      // Add test items
      items.value = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }))

      expect(getStartIndex.value).toBe(0)
      expect(getEndIndex.value).toBeGreaterThan(0)
      expect(visibleItems.value.length).toBeGreaterThan(0)
    })

    it('should handle scroll correctly', () => {
      const { handleScroll, state } = useVirtualization()

      const mockEvent = {
        target: {
          scrollTop: 100,
          scrollLeft: 0
        }
      }

      handleScroll(mockEvent)

      expect(state.scrollTop).toBe(100)
      expect(state.isScrolling).toBe(true)
    })

    it('should scroll to index correctly', () => {
      const mockContainer = {
        scrollTop: 0,
        scrollLeft: 0
      }

      const { containerRef, scrollToIndex, items } = useVirtualization({
        itemHeight: 50
      })

      containerRef.value = mockContainer
      items.value = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }))

      scrollToIndex(10)

      expect(mockContainer.scrollTop).toBe(500) // 10 * 50
    })
  })
})
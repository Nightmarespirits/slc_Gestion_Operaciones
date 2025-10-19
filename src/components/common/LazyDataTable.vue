<template>
  <div class="lazy-data-table">
    <!-- Search and Filters Section -->
    <v-card v-if="showSearch || showFilters" flat class="mb-4">
      <v-card-text>
        <v-row align="center">
          <!-- Search Field -->
          <v-col v-if="showSearch" cols="12" md="6">
            <v-text-field v-model="searchTerm" :placeholder="searchPlaceholder" prepend-inner-icon="mdi-magnify"
              variant="outlined" density="compact" clearable hide-details :loading="isSearching"
              @click:clear="clearSearch">
              <template #append-inner>
                <v-fade-transition>
                  <v-progress-circular v-if="isSearching" size="20" width="2" indeterminate color="primary" />
                </v-fade-transition>
              </template>
            </v-text-field>
          </v-col>

          <!-- Custom Filters Slot -->
          <v-col v-if="showFilters" cols="12" md="6">
            <slot name="filters" :filters="filters" :update-filter="updateFilter" />
          </v-col>

          <!-- Actions Slot -->
          <v-col v-if="$slots.actions" cols="12" md="auto">
            <slot name="actions" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Data Table Container -->
    <v-card>
      <!-- Skeleton Loader for Initial Loading -->
      <SkeletonLoader v-if="isInitialLoading" variant="table" :rows="skeletonRows" animation="wave" />

      <!-- Data Table -->
      <template v-else>
        <!-- Table Header with Item Count -->
        <v-card-title v-if="showHeader" class="d-flex align-center">
          <slot name="title">
            <span>{{ title }}</span>
          </slot>
          <v-spacer />
          <v-chip v-if="showItemCount" variant="outlined" size="small" color="primary">
            {{ totalItems }} {{ itemCountLabel }}
          </v-chip>
        </v-card-title>

        <!-- Virtualized Data Table -->
        <v-data-table-virtual :headers="computedHeaders" :items="items" :loading="isLoadingMore" :height="tableHeight"
          :item-value="itemValue" :sort-by="sortBy" :multi-sort="multiSort" :must-sort="mustSort" :items-per-page="-1"
          :hide-default-footer="true" class="lazy-data-table__table" @update:sort-by="handleSortUpdate">
          <!-- Pass through all slots -->
          <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
            <slot v-if="!['title', 'filters', 'actions', 'loading-more', 'no-data', 'error'].includes(slotName)"
              :name="slotName" v-bind="slotProps" />
          </template>

          <!-- Custom No Data State -->
          <template #no-data>
            <div class="text-center pa-8">
              <slot name="no-data">
                <v-icon size="64" color="grey-lighten-1" class="mb-4">
                  {{ noDataIcon }}
                </v-icon>
                <div class="text-h6 text-grey-darken-1 mb-2">
                  {{ noDataText }}
                </div>
                <div class="text-body-2 text-grey">
                  {{ noDataSubtext }}
                </div>
                <v-btn v-if="hasError" color="primary" variant="outlined" class="mt-4" @click="retry">
                  <v-icon start>mdi-refresh</v-icon>
                  Reintentar
                </v-btn>
              </slot>
            </div>
          </template>
        </v-data-table-virtual>

        <!-- Load More Indicator -->
        <div v-if="canLoadMore || isLoadingMore" ref="loadMoreTrigger" class="load-more-trigger">
          <v-progress-linear v-if="isLoadingMore" indeterminate color="primary" height="3" />
          <div v-else-if="canLoadMore" class="text-center pa-4">
            <slot name="loading-more">
              <v-btn variant="outlined" color="primary" :loading="isLoadingMore" @click="loadMore">
                <v-icon start>mdi-chevron-down</v-icon>
                Cargar más
              </v-btn>
            </slot>
          </div>
        </div>

        <!-- Error State -->
        <v-alert v-if="hasError && !isInitialLoading" type="error" variant="tonal" class="ma-4">
          <template #title>Error al cargar datos</template>
          <slot name="error" :error="errorMessage" :retry="retry">
            {{ errorMessage }}
            <div class="mt-2">
              <v-btn size="small" color="error" variant="outlined" @click="retry">
                <v-icon start>mdi-refresh</v-icon>
                Reintentar
              </v-btn>
            </div>
          </slot>
        </v-alert>
      </template>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useLazyLoading } from '../../composables/useLazyLoading'
import { useSearchDebounce } from '../../composables/useDebounce'
import { useInfiniteScroll } from '../../composables/useInfiniteScroll'
import SkeletonLoader from './SkeletonLoader.vue'

const props = defineProps({
  // Data source function
  fetchFunction: {
    type: Function,
    required: true
  },

  // Table configuration
  headers: {
    type: Array,
    required: true
  },

  title: {
    type: String,
    default: ''
  },

  itemValue: {
    type: String,
    default: 'id'
  },

  // Pagination settings
  initialLimit: {
    type: Number,
    default: 50
  },

  loadMoreLimit: {
    type: Number,
    default: 50
  },

  // Search configuration
  showSearch: {
    type: Boolean,
    default: true
  },

  searchPlaceholder: {
    type: String,
    default: 'Buscar...'
  },

  searchDebounce: {
    type: Number,
    default: 300
  },

  // Filters
  showFilters: {
    type: Boolean,
    default: false
  },

  initialFilters: {
    type: Object,
    default: () => ({})
  },

  // UI configuration
  showHeader: {
    type: Boolean,
    default: true
  },

  showItemCount: {
    type: Boolean,
    default: true
  },

  itemCountLabel: {
    type: String,
    default: 'elementos'
  },

  tableHeight: {
    type: [String, Number],
    default: 600
  },

  skeletonRows: {
    type: Number,
    default: 10
  },

  // Sorting
  sortBy: {
    type: Array,
    default: () => []
  },

  multiSort: {
    type: Boolean,
    default: false
  },

  mustSort: {
    type: Boolean,
    default: false
  },

  // Cache configuration
  cacheKey: {
    type: String,
    default: null
  },

  enableCache: {
    type: Boolean,
    default: true
  },

  // Infinite scroll
  enableInfiniteScroll: {
    type: Boolean,
    default: true
  },

  // No data state
  noDataIcon: {
    type: String,
    default: 'mdi-database-search'
  },

  noDataText: {
    type: String,
    default: 'No hay datos disponibles'
  },

  noDataSubtext: {
    type: String,
    default: 'Intenta ajustar los filtros de búsqueda'
  }
})

const emit = defineEmits([
  'update:items',
  'update:loading',
  'update:error',
  'item-click',
  'sort-change',
  'search-change',
  'filter-change'
])

// Internal state
const searchTerm = ref('')
const filters = ref({ ...props.initialFilters })
const loadMoreTrigger = ref(null)

// Lazy loading composable
const {
  state: lazyState,
  hasItems,
  isLoading,
  canLoadMore,
  loadInitial,
  loadMore: loadMoreData,
  search,
  updateSort,
  refresh,
  reset
} = useLazyLoading({
  initialLimit: props.initialLimit,
  loadMoreLimit: props.loadMoreLimit,
  fetchFunction: props.fetchFunction,
  cacheKey: props.cacheKey,
  enableCache: props.enableCache
})

// Search debounce
const {
  isSearching,
  updateSearch
} = useSearchDebounce(
  searchTerm,
  props.searchDebounce,
  {
    onSearch: (term) => search(term, filters.value),
    onClear: () => search('', filters.value)
  }
)

// Infinite scroll
const infiniteScrollComposable = useInfiniteScroll({
  loadMoreFunction: loadMoreData,
  canLoadMore: () => canLoadMore.value,
  debounceDelay: 200
})

const { targetElement: infiniteScrollTarget } = infiniteScrollComposable

// Computed properties
const items = computed(() => lazyState.items)
const totalItems = computed(() => lazyState.pagination.total)
const isInitialLoading = computed(() => lazyState.loading.initial)
const isLoadingMore = computed(() => lazyState.loading.loadMore)
const hasError = computed(() => !!lazyState.error)
const errorMessage = computed(() => lazyState.error || '')

const computedHeaders = computed(() => {
  return props.headers.map(header => ({
    ...header,
    sortable: header.sortable !== false
  }))
})

// Methods
const handleSortUpdate = async (sortItems) => {
  if (sortItems.length > 0) {
    const { key, order } = sortItems[0]
    await updateSort(key, order)
    emit('sort-change', { key, order })
  }
}

const updateFilter = async (filterKey, filterValue) => {
  filters.value[filterKey] = filterValue
  await search(searchTerm.value, filters.value)
  emit('filter-change', filters.value)
}

const clearSearch = async () => {
  searchTerm.value = ''
  await search('', filters.value)
}

const loadMore = async () => {
  try {
    await loadMoreData()
  } catch (error) {
    console.error('Error loading more data:', error)
  }
}

const retry = async () => {
  try {
    await refresh()
  } catch (error) {
    console.error('Error retrying:', error)
  }
}

// Watchers
watch(searchTerm, (newValue) => {
  updateSearch(newValue)
  emit('search-change', newValue)
})

watch(items, (newItems) => {
  emit('update:items', newItems)
})

watch(isLoading, (newLoading) => {
  emit('update:loading', newLoading)
})

watch(hasError, (newError) => {
  emit('update:error', newError ? errorMessage.value : null)
})

// Setup infinite scroll observer
watch(loadMoreTrigger, async (newTrigger) => {
  if (newTrigger && props.enableInfiniteScroll) {
    await nextTick()
    try {
      infiniteScrollTarget.value = newTrigger
    } catch (error) {
      console.error('Error setting up infinite scroll observer:', error)
    }
  }
})

// Lifecycle
onMounted(async () => {
  try {
    await loadInitial()
  } catch (error) {
    console.error('Error loading initial data:', error)
  }
})

onUnmounted(() => {
  try {
    if (infiniteScrollComposable.disconnect) {
      infiniteScrollComposable.disconnect()
    }
  } catch (error) {
    console.error('Error cleaning up infinite scroll observer:', error)
  }
})

// Expose methods for parent component
defineExpose({
  refresh,
  reset,
  loadMore,
  search: (term, additionalFilters) => search(term, { ...filters.value, ...additionalFilters }),
  updateFilter,
  items: items,
  totalItems: totalItems,
  isLoading: isLoading,
  hasError: hasError
})
</script>

<style scoped>
.lazy-data-table {
  width: 100%;
}

.lazy-data-table__table {
  /* Ensure proper virtualization */
  contain: layout style paint;
}

.load-more-trigger {
  min-height: 1px;
  position: relative;
}

/* Smooth transitions */
.lazy-data-table :deep(.v-data-table__wrapper) {
  transition: opacity 0.2s ease;
}

.lazy-data-table :deep(.v-data-table-virtual__wrapper) {
  /* Optimize scrolling performance */
  will-change: transform;
}

/* Loading states */
.lazy-data-table :deep(.v-data-table--loading .v-data-table__wrapper) {
  opacity: 0.6;
}

/* Custom scrollbar for better UX */
.lazy-data-table :deep(.v-data-table-virtual__wrapper)::-webkit-scrollbar {
  width: 8px;
}

.lazy-data-table :deep(.v-data-table-virtual__wrapper)::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.lazy-data-table :deep(.v-data-table-virtual__wrapper)::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.lazy-data-table :deep(.v-data-table-virtual__wrapper)::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}
</style>
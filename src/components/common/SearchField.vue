<template>
  <div class="search-field">
    <v-text-field
      v-model="searchValue"
      :placeholder="placeholder"
      :prepend-inner-icon="prependIcon"
      :append-inner-icon="appendIcon"
      :variant="variant"
      :density="density"
      :clearable="clearable"
      :hide-details="hideDetails"
      :disabled="disabled"
      :readonly="readonly"
      :loading="isSearching"
      :error="hasError"
      :error-messages="errorMessage"
      class="search-field__input"
      @click:clear="handleClear"
      @keydown.enter="handleEnterKey"
      @keydown.escape="handleEscapeKey"
      @keydown.arrow-down="handleArrowDown"
      @keydown.arrow-up="handleArrowUp"
      @focus="handleFocus"
      @blur="handleBlur"
    >
      <!-- Loading indicator -->
      <template #append-inner>
        <v-fade-transition>
          <v-progress-circular
            v-if="isSearching"
            size="20"
            width="2"
            indeterminate
            :color="loadingColor"
          />
          <v-icon
            v-else-if="appendIcon"
            :color="appendIconColor"
            @click="handleAppendClick"
          >
            {{ appendIcon }}
          </v-icon>
        </v-fade-transition>
      </template>

      <!-- Custom prepend icon -->
      <template v-if="$slots['prepend-inner']" #prepend-inner>
        <slot name="prepend-inner" />
      </template>
    </v-text-field>

    <!-- Suggestions/Autocomplete Dropdown -->
    <v-menu
      v-model="showSuggestions"
      :target="menuTarget"
      :close-on-content-click="false"
      :max-width="menuMaxWidth"
      :offset="[0, 4]"
      :z-index="2000"
      transition="slide-y-transition"
    >
      <v-card v-if="displaySuggestions.length > 0" elevation="8">
        <!-- Suggestions Header -->
        <v-card-subtitle v-if="showSuggestionsHeader" class="pb-2">
          <div class="d-flex align-center">
            <v-icon size="small" class="mr-2">mdi-history</v-icon>
            {{ suggestionsHeaderText }}
            <v-spacer />
            <v-btn
              v-if="showClearHistory"
              size="x-small"
              variant="text"
              color="grey"
              @click="clearHistory"
            >
              Limpiar
            </v-btn>
          </div>
        </v-card-subtitle>

        <!-- Suggestions List -->
        <v-list density="compact" class="py-0">
          <v-list-item
            v-for="(suggestion, index) in displaySuggestions"
            :key="`suggestion-${index}`"
            :class="{
              'v-list-item--active': index === selectedSuggestionIndex
            }"
            @click="selectSuggestion(suggestion)"
            @mouseenter="selectedSuggestionIndex = index"
          >
            <template #prepend>
              <v-icon size="small" :color="suggestionIconColor">
                {{ getSuggestionIcon(suggestion) }}
              </v-icon>
            </template>

            <v-list-item-title>
              <span v-html="highlightMatch(suggestion.text || suggestion)" />
            </v-list-item-title>

            <v-list-item-subtitle v-if="suggestion.subtitle">
              {{ suggestion.subtitle }}
            </v-list-item-subtitle>

            <template #append>
              <v-btn
                v-if="showRemoveSuggestion"
                size="x-small"
                variant="text"
                icon="mdi-close"
                @click.stop="removeSuggestion(index)"
              />
            </template>
          </v-list-item>
        </v-list>

        <!-- No suggestions message -->
        <v-card-text v-if="searchValue && displaySuggestions.length === 0" class="text-center py-4">
          <v-icon color="grey-lighten-1" class="mb-2">mdi-magnify-close</v-icon>
          <div class="text-body-2 text-grey">
            {{ noSuggestionsText }}
          </div>
        </v-card-text>

        <!-- Custom suggestions slot -->
        <slot
          name="suggestions"
          :suggestions="displaySuggestions"
          :select-suggestion="selectSuggestion"
          :search-value="searchValue"
        />
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useSearchDebounce } from '../../composables/useDebounce'

const props = defineProps({
  // Basic props
  modelValue: {
    type: String,
    default: ''
  },

  placeholder: {
    type: String,
    default: 'Buscar...'
  },

  // Vuetify text field props
  variant: {
    type: String,
    default: 'outlined'
  },

  density: {
    type: String,
    default: 'compact'
  },

  clearable: {
    type: Boolean,
    default: true
  },

  hideDetails: {
    type: Boolean,
    default: true
  },

  disabled: {
    type: Boolean,
    default: false
  },

  readonly: {
    type: Boolean,
    default: false
  },

  // Icons
  prependIcon: {
    type: String,
    default: 'mdi-magnify'
  },

  appendIcon: {
    type: String,
    default: null
  },

  appendIconColor: {
    type: String,
    default: 'grey'
  },

  loadingColor: {
    type: String,
    default: 'primary'
  },

  // Search configuration
  debounceDelay: {
    type: Number,
    default: 300
  },

  minSearchLength: {
    type: Number,
    default: 0
  },

  maxSuggestions: {
    type: Number,
    default: 8
  },

  // Suggestions configuration
  enableSuggestions: {
    type: Boolean,
    default: true
  },

  suggestions: {
    type: Array,
    default: () => []
  },

  enableHistory: {
    type: Boolean,
    default: true
  },

  maxHistorySize: {
    type: Number,
    default: 10
  },

  showSuggestionsHeader: {
    type: Boolean,
    default: true
  },

  suggestionsHeaderText: {
    type: String,
    default: 'Búsquedas recientes'
  },

  showClearHistory: {
    type: Boolean,
    default: true
  },

  showRemoveSuggestion: {
    type: Boolean,
    default: true
  },

  suggestionIconColor: {
    type: String,
    default: 'grey-lighten-1'
  },

  noSuggestionsText: {
    type: String,
    default: 'No se encontraron sugerencias'
  },

  // Menu configuration
  menuMaxWidth: {
    type: [String, Number],
    default: 400
  },

  // Custom search function
  searchFunction: {
    type: Function,
    default: null
  },

  // Auto-focus
  autofocus: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:modelValue',
  'search',
  'clear',
  'focus',
  'blur',
  'suggestion-select',
  'append-click'
])

// Internal state
const searchValue = ref(props.modelValue)
const showSuggestions = ref(false)
const selectedSuggestionIndex = ref(-1)
const isFocused = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const menuTarget = ref(null)

// Search history
const searchHistory = ref([])

// Search debounce composable
const {
  isSearching,
  searchHistory: debounceHistory,
  getSuggestions,
  clearHistory: clearDebounceHistory
} = useSearchDebounce(
  searchValue,
  props.debounceDelay,
  {
    minLength: props.minSearchLength,
    onSearch: handleSearch,
    onClear: handleClearSearch
  }
)

// Computed properties
const displaySuggestions = computed(() => {
  let suggestions = []

  // Add custom suggestions
  if (props.suggestions.length > 0) {
    suggestions = [...props.suggestions]
  }

  // Add history-based suggestions if enabled
  if (props.enableHistory) {
    const historySuggestions = getSuggestions(searchValue.value)
    suggestions = [...suggestions, ...historySuggestions.map(text => ({ text, type: 'history' }))]
  }

  // Remove duplicates and limit
  const uniqueSuggestions = suggestions.filter((suggestion, index, self) => {
    const text = suggestion.text || suggestion
    return self.findIndex(s => (s.text || s) === text) === index
  })

  return uniqueSuggestions.slice(0, props.maxSuggestions)
})

// Methods
async function handleSearch(searchTerm) {
  try {
    hasError.value = false
    errorMessage.value = ''

    if (props.searchFunction) {
      await props.searchFunction(searchTerm)
    }

    emit('search', searchTerm)
  } catch (error) {
    console.error('Error en búsqueda:', error)
    hasError.value = true
    errorMessage.value = error.message || 'Error en la búsqueda'
  }
}

function handleClearSearch() {
  emit('clear')
}

function handleClear() {
  searchValue.value = ''
  showSuggestions.value = false
  selectedSuggestionIndex.value = -1
  emit('clear')
}

function handleEnterKey() {
  if (selectedSuggestionIndex.value >= 0 && displaySuggestions.value.length > 0) {
    selectSuggestion(displaySuggestions.value[selectedSuggestionIndex.value])
  } else {
    showSuggestions.value = false
    // Force immediate search
    if (props.searchFunction) {
      handleSearch(searchValue.value)
    }
  }
}

function handleEscapeKey() {
  showSuggestions.value = false
  selectedSuggestionIndex.value = -1
}

function handleArrowDown() {
  if (!showSuggestions.value) {
    showSuggestions.value = true
    return
  }

  selectedSuggestionIndex.value = Math.min(
    selectedSuggestionIndex.value + 1,
    displaySuggestions.value.length - 1
  )
}

function handleArrowUp() {
  if (!showSuggestions.value) return

  selectedSuggestionIndex.value = Math.max(
    selectedSuggestionIndex.value - 1,
    -1
  )
}

function handleFocus() {
  isFocused.value = true
  
  if (props.enableSuggestions && displaySuggestions.value.length > 0) {
    showSuggestions.value = true
  }
  
  emit('focus')
}

function handleBlur() {
  isFocused.value = false
  
  // Delay hiding suggestions to allow for clicks
  setTimeout(() => {
    if (!isFocused.value) {
      showSuggestions.value = false
      selectedSuggestionIndex.value = -1
    }
  }, 200)
  
  emit('blur')
}

function handleAppendClick() {
  emit('append-click')
}

function selectSuggestion(suggestion) {
  const text = suggestion.text || suggestion
  searchValue.value = text
  showSuggestions.value = false
  selectedSuggestionIndex.value = -1
  
  emit('suggestion-select', suggestion)
  
  // Trigger search immediately
  if (props.searchFunction) {
    handleSearch(text)
  }
}

function removeSuggestion(index) {
  const suggestion = displaySuggestions.value[index]
  const text = suggestion.text || suggestion
  
  // Remove from history if it's a history item
  if (suggestion.type === 'history') {
    const historyIndex = debounceHistory.value.indexOf(text)
    if (historyIndex !== -1) {
      debounceHistory.value.splice(historyIndex, 1)
    }
  }
}

function clearHistory() {
  clearDebounceHistory()
}

function getSuggestionIcon(suggestion) {
  if (suggestion.icon) return suggestion.icon
  if (suggestion.type === 'history') return 'mdi-history'
  return 'mdi-magnify'
}

function highlightMatch(text) {
  if (!searchValue.value || searchValue.value.length < 2) return text
  
  const regex = new RegExp(`(${searchValue.value})`, 'gi')
  return text.replace(regex, '<strong>$1</strong>')
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  searchValue.value = newValue
})

watch(searchValue, (newValue) => {
  emit('update:modelValue', newValue)
  
  // Show suggestions when typing
  if (props.enableSuggestions && isFocused.value && newValue.length >= props.minSearchLength) {
    showSuggestions.value = displaySuggestions.value.length > 0
  } else {
    showSuggestions.value = false
  }
  
  selectedSuggestionIndex.value = -1
})

// Lifecycle
onMounted(async () => {
  await nextTick()
  
  // Set menu target
  menuTarget.value = document.querySelector('.search-field__input .v-field')
  
  // Auto-focus if enabled
  if (props.autofocus) {
    const input = document.querySelector('.search-field__input input')
    if (input) {
      input.focus()
    }
  }
})

onUnmounted(() => {
  // Cleanup
})

// Expose methods
defineExpose({
  focus: () => {
    const input = document.querySelector('.search-field__input input')
    if (input) input.focus()
  },
  blur: () => {
    const input = document.querySelector('.search-field__input input')
    if (input) input.blur()
  },
  clear: handleClear,
  search: (term) => handleSearch(term || searchValue.value),
  clearHistory,
  value: searchValue
})
</script>

<style scoped>
.search-field {
  position: relative;
  width: 100%;
}

.search-field__input {
  width: 100%;
}

/* Suggestions menu styling */
.search-field :deep(.v-menu > .v-overlay__content) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  overflow: hidden;
}

/* Active suggestion highlighting */
.search-field :deep(.v-list-item--active) {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

/* Suggestion text highlighting */
.search-field :deep(strong) {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

/* Loading state */
.search-field :deep(.v-text-field--loading .v-field__outline) {
  border-color: rgb(var(--v-theme-primary));
}

/* Error state */
.search-field :deep(.v-text-field--error .v-field__outline) {
  border-color: rgb(var(--v-theme-error));
}

/* Focus state */
.search-field :deep(.v-text-field .v-field--focused .v-field__outline) {
  border-width: 2px;
}

/* Smooth transitions */
.search-field :deep(.v-text-field .v-field) {
  transition: all 0.2s ease;
}

.search-field :deep(.v-progress-circular) {
  transition: opacity 0.2s ease;
}
</style>
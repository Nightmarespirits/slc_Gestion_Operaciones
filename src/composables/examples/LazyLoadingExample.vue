<template>
  <v-container>
    <v-card>
      <v-card-title>
        Ejemplo de Lazy Loading
        <v-spacer />
        <v-chip :color="isLoading ? 'warning' : 'success'">
          {{ isLoading ? 'Cargando...' : `${state.items.length} items` }}
        </v-chip>
      </v-card-title>
      
      <v-card-text>
        <!-- Campo de búsqueda con debounce -->
        <v-text-field
          v-model="searchTerm"
          label="Buscar..."
          prepend-inner-icon="mdi-magnify"
          :loading="state.loading.search"
          clearable
          @click:clear="clearSearch"
        />
        
        <!-- Lista de items -->
        <v-list v-if="hasItems" max-height="400" class="overflow-y-auto">
          <v-list-item
            v-for="item in state.items"
            :key="item.id"
            :title="item.name"
            :subtitle="`ID: ${item.id}`"
          >
            <template #prepend>
              <v-avatar color="primary">
                {{ item.id }}
              </v-avatar>
            </template>
          </v-list-item>
          
          <!-- Indicador de carga para más datos -->
          <v-list-item v-if="state.loading.loadMore">
            <v-list-item-title class="text-center">
              <v-progress-circular indeterminate size="24" />
              Cargando más datos...
            </v-list-item-title>
          </v-list-item>
          
          <!-- Botón para cargar más -->
          <v-list-item v-else-if="canLoadMore">
            <v-btn
              block
              variant="outlined"
              @click="loadMore"
            >
              Cargar más datos
            </v-btn>
          </v-list-item>
        </v-list>
        
        <!-- Estado vacío -->
        <v-empty-state
          v-else-if="!isLoading"
          headline="No hay datos"
          title="No se encontraron elementos"
          text="Intenta ajustar los filtros de búsqueda"
        />
        
        <!-- Loading inicial -->
        <div v-else class="text-center py-8">
          <v-progress-circular indeterminate size="48" />
          <p class="mt-4">Cargando datos iniciales...</p>
        </div>
      </v-card-text>
      
      <v-card-actions>
        <v-btn @click="refresh" :loading="state.loading.initial">
          <v-icon>mdi-refresh</v-icon>
          Actualizar
        </v-btn>
        
        <v-btn @click="reset">
          <v-icon>mdi-restore</v-icon>
          Resetear
        </v-btn>
        
        <v-spacer />
        
        <v-chip variant="outlined">
          Página: {{ state.pagination.page }}
        </v-chip>
        
        <v-chip variant="outlined">
          Total: {{ state.pagination.total }}
        </v-chip>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useLazyLoading } from '../useLazyLoading.js'
import { useSearchDebounce } from '../useDebounce.js'

// Función mock para simular API
const mockFetchData = async (params) => {
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const { page, limit, search } = params
  const startIndex = (page - 1) * limit
  
  // Generar datos mock
  let allItems = Array.from({ length: 1000 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    description: `Descripción del item ${i + 1}`
  }))
  
  // Filtrar por búsqueda si existe
  if (search) {
    allItems = allItems.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
    )
  }
  
  // Paginar
  const items = allItems.slice(startIndex, startIndex + limit)
  
  return {
    data: items,
    total: allItems.length,
    page,
    limit
  }
}

// Configurar lazy loading
const {
  state,
  hasItems,
  isLoading,
  canLoadMore,
  loadInitial,
  loadMore,
  search,
  refresh,
  reset
} = useLazyLoading({
  initialLimit: 20,
  loadMoreLimit: 20,
  fetchFunction: mockFetchData,
  enableCache: true,
  cacheKey: 'example-data'
})

// Configurar búsqueda con debounce
const searchTerm = ref('')
const { updateSearch, clearSearch } = useSearchDebounce(
  searchTerm,
  300,
  {
    minLength: 2,
    onSearch: async (term) => {
      await search(term)
    },
    onClear: async () => {
      await search('')
    }
  }
)

// Watcher para sincronizar búsqueda
watch(searchTerm, (newTerm) => {
  updateSearch(newTerm)
})

// Cargar datos iniciales
loadInitial()
</script>

<style scoped>
.v-list {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}
</style>
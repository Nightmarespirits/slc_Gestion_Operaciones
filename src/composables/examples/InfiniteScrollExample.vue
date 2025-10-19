<template>
  <v-container>
    <v-card>
      <v-card-title>
        Ejemplo de Infinite Scroll
        <v-spacer />
        <v-chip :color="isLoading ? 'warning' : 'success'">
          {{ items.length }} items cargados
        </v-chip>
      </v-card-title>
      
      <v-card-text>
        <!-- Lista con scroll infinito -->
        <div 
          ref="scrollContainer"
          class="scroll-container"
          style="height: 400px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 4px;"
        >
          <v-list>
            <v-list-item
              v-for="item in items"
              :key="item.id"
              :title="item.title"
              :subtitle="item.subtitle"
            >
              <template #prepend>
                <v-avatar :color="item.color">
                  {{ item.id }}
                </v-avatar>
              </template>
              
              <template #append>
                <v-chip size="small" variant="outlined">
                  {{ item.category }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
          
          <!-- Elemento trigger para intersection observer -->
          <div 
            ref="targetElement"
            class="d-flex justify-center align-center pa-4"
            style="min-height: 60px;"
          >
            <div v-if="isLoading" class="text-center">
              <v-progress-circular indeterminate size="24" />
              <p class="mt-2 text-caption">Cargando más elementos...</p>
            </div>
            <div v-else-if="hasError" class="text-center">
              <v-icon color="error">mdi-alert-circle</v-icon>
              <p class="mt-2 text-caption text-error">{{ errorMessage }}</p>
              <v-btn size="small" @click="forceLoadMore">Reintentar</v-btn>
            </div>
            <div v-else-if="hasMoreData" class="text-center">
              <v-icon>mdi-chevron-down</v-icon>
              <p class="text-caption">Scroll para cargar más</p>
            </div>
            <div v-else class="text-center">
              <v-icon>mdi-check-circle</v-icon>
              <p class="text-caption">No hay más elementos</p>
            </div>
          </div>
        </div>
      </v-card-text>
      
      <v-card-actions>
        <v-btn @click="resetData">
          <v-icon>mdi-restore</v-icon>
          Resetear
        </v-btn>
        
        <v-btn @click="forceLoadMore" :disabled="!hasMoreData || isLoading">
          <v-icon>mdi-plus</v-icon>
          Cargar más
        </v-btn>
        
        <v-spacer />
        
        <v-btn @click="scrollToTop">
          <v-icon>mdi-arrow-up</v-icon>
          Ir arriba
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useInfiniteScroll } from '../useInfiniteScroll.js'

// Estado de datos
const items = ref([])
const currentPage = ref(1)
const hasMoreData = ref(true)
const scrollContainer = ref(null)

// Colores y categorías para variedad visual
const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info']
const categories = ['Trabajo', 'Personal', 'Urgente', 'Revisión', 'Completado']

// Función para generar datos mock
const generateMockData = (page, limit = 15) => {
  const startId = (page - 1) * limit + 1
  const newItems = []
  
  for (let i = 0; i < limit; i++) {
    const id = startId + i
    newItems.push({
      id,
      title: `Elemento ${id}`,
      subtitle: `Descripción detallada del elemento número ${id}`,
      color: colors[id % colors.length],
      category: categories[id % categories.length]
    })
  }
  
  return newItems
}

// Función para cargar más datos
const loadMoreData = async () => {
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 800))
  
  // Simular error ocasional (5% de probabilidad)
  if (Math.random() < 0.05) {
    throw new Error('Error de conexión simulado')
  }
  
  const newItems = generateMockData(currentPage.value)
  items.value.push(...newItems)
  currentPage.value++
  
  // Simular fin de datos después de 10 páginas
  if (currentPage.value > 10) {
    hasMoreData.value = false
  }
}

// Configurar infinite scroll
const {
  targetElement,
  isLoading,
  hasError,
  errorMessage,
  forceLoadMore,
  resetObserver
} = useInfiniteScroll({
  loadMoreFunction: loadMoreData,
  canLoadMore: () => hasMoreData.value,
  threshold: 0.1,
  rootMargin: '50px',
  debounceDelay: 200
})

// Función para resetear datos
const resetData = () => {
  items.value = []
  currentPage.value = 1
  hasMoreData.value = true
  
  // Cargar datos iniciales
  loadMoreData()
  
  // Resetear observer
  resetObserver()
}

// Función para scroll al inicio
const scrollToTop = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
}

// Cargar datos iniciales al montar
onMounted(() => {
  loadMoreData()
})
</script>

<style scoped>
.scroll-container {
  position: relative;
}

.scroll-container::-webkit-scrollbar {
  width: 8px;
}

.scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.scroll-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.scroll-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
# Composables de Optimización de Rendimiento

Este directorio contiene composables especializados para optimizar el rendimiento del sistema de gestión de operaciones de lavandería, implementando lazy loading, debounce, scroll infinito y virtualización.

## 📋 Composables Implementados

### 1. `useLazyLoading.js`
Implementa paginación y carga incremental de datos con sistema de caché inteligente.

**Características:**
- ✅ Carga inicial configurable (por defecto 50 registros)
- ✅ Carga incremental con `loadMore()`
- ✅ Sistema de caché con TTL de 5 minutos
- ✅ Búsqueda con filtros reactivos
- ✅ Estados de loading granulares (initial, loadMore, search)
- ✅ Manejo de errores con retry automático

**Uso básico:**
```javascript
import { useLazyLoading } from '@/composables/useLazyLoading'

const { 
  state, 
  hasItems, 
  isLoading, 
  canLoadMore,
  loadInitial, 
  loadMore, 
  search 
} = useLazyLoading({
  initialLimit: 50,
  fetchFunction: async (params) => {
    const response = await api.getOperaciones(params)
    return {
      data: response.data,
      total: response.total
    }
  },
  enableCache: true,
  cacheKey: 'operaciones'
})

// Cargar datos iniciales
await loadInitial()

// Buscar
await search('término de búsqueda')

// Cargar más datos
await loadMore()
```

### 2. `useDebounce.js`
Optimiza búsquedas y consultas con delay configurable y funcionalidades avanzadas.

**Características:**
- ✅ Debounce configurable (por defecto 300ms)
- ✅ `useSearchDebounce` con historial de búsquedas
- ✅ `useDebouncedFunction` para funciones genéricas
- ✅ Cancelación y flush manual
- ✅ Sugerencias basadas en historial

**Uso básico:**
```javascript
import { useSearchDebounce } from '@/composables/useDebounce'

const searchTerm = ref('')
const { 
  debouncedValue, 
  isSearching, 
  searchHistory,
  getSuggestions 
} = useSearchDebounce(
  searchTerm,
  300,
  {
    minLength: 2,
    onSearch: async (term) => {
      await searchOperaciones(term)
    },
    onClear: async () => {
      await clearResults()
    }
  }
)
```

### 3. `useInfiniteScroll.js`
Implementa scroll infinito con Intersection Observer y fallback a scroll position.

**Características:**
- ✅ Intersection Observer para detección automática
- ✅ Fallback a scroll position si no hay soporte
- ✅ Debounce integrado para evitar llamadas excesivas
- ✅ Control granular de estados de carga
- ✅ Soporte para scroll horizontal y vertical

**Uso básico:**
```javascript
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'

const { 
  targetElement, 
  isLoading, 
  hasError, 
  forceLoadMore 
} = useInfiniteScroll({
  loadMoreFunction: async () => {
    await loadMoreOperaciones()
  },
  canLoadMore: () => hasMoreData.value,
  threshold: 0.1,
  rootMargin: '100px'
})
```

### 4. `useVirtualization.js`
Maneja listas grandes con windowing para optimizar el DOM.

**Características:**
- ✅ Windowing eficiente para listas de miles de elementos
- ✅ Soporte para alturas dinámicas
- ✅ `useVirtualTable` especializado para tablas
- ✅ `useVirtualGroupedList` para listas agrupadas
- ✅ Scroll programático a índices específicos

**Uso básico:**
```javascript
import { useVirtualization } from '@/composables/useVirtualization'

const { 
  containerRef, 
  items, 
  visibleItems, 
  totalSize,
  scrollToIndex 
} = useVirtualization({
  itemHeight: 50,
  containerHeight: 400,
  overscan: 5
})

// Asignar datos
items.value = largeDataArray

// Scroll a un elemento específico
scrollToIndex(100, 'center')
```

## 🎯 Requisitos Cumplidos

| Requisito | Descripción | Composable | Estado |
|-----------|-------------|------------|--------|
| 1.1 | Carga inicial de 50 registros | `useLazyLoading` | ✅ |
| 1.2 | Carga automática al hacer scroll | `useInfiniteScroll` | ✅ |
| 1.3 | Búsqueda con debounce de 300ms | `useDebounce` | ✅ |
| 1.4 | Mantenimiento de posición de scroll | `useLazyLoading` + `useVirtualization` | ✅ |
| 1.5 | Paginación virtual para +1000 registros | `useVirtualization` | ✅ |
| 3.1 | Carga inicial de 30 registros para procesos | `useLazyLoading` | ✅ |
| 3.3 | Búsqueda optimizada con debounce | `useSearchDebounce` | ✅ |

## 📁 Estructura de Archivos

```
composables/
├── useLazyLoading.js          # Paginación y carga incremental
├── useDebounce.js             # Debounce para búsquedas
├── useInfiniteScroll.js       # Scroll infinito
├── useVirtualization.js       # Virtualización de listas
├── useOptimisticUpdates.js    # Actualizaciones optimistas (existente)
├── index.js                   # Exportaciones centralizadas
├── examples/                  # Ejemplos de uso
│   ├── LazyLoadingExample.vue
│   └── InfiniteScrollExample.vue
└── README.md                  # Esta documentación
```

## 🚀 Ejemplos de Integración

### Tabla de Operaciones con Lazy Loading
```vue
<template>
  <v-data-table
    :headers="headers"
    :items="state.items"
    :loading="isLoading"
    :server-items-length="state.pagination.total"
    @update:options="handleTableUpdate"
  >
    <!-- Skeleton loader -->
    <template v-if="state.loading.initial" #body>
      <SkeletonLoader :rows="10" />
    </template>
    
    <!-- Load more button -->
    <template #bottom>
      <v-btn 
        v-if="canLoadMore" 
        @click="loadMore"
        :loading="state.loading.loadMore"
        block
      >
        Cargar más registros
      </v-btn>
    </template>
  </v-data-table>
</template>

<script setup>
import { useLazyLoading } from '@/composables'

const { state, isLoading, canLoadMore, loadMore } = useLazyLoading({
  fetchFunction: fetchOperaciones
})
</script>
```

### Campo de Búsqueda Optimizado
```vue
<template>
  <v-text-field
    v-model="searchTerm"
    label="Buscar operaciones..."
    :loading="isSearching"
    clearable
  >
    <template #append-inner>
      <v-menu v-if="searchHistory.length > 0">
        <template #activator="{ props }">
          <v-btn icon="mdi-history" v-bind="props" size="small" />
        </template>
        <v-list>
          <v-list-item
            v-for="term in searchHistory"
            :key="term"
            @click="searchTerm = term"
          >
            {{ term }}
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
  </v-text-field>
</template>

<script setup>
import { useSearchDebounce } from '@/composables'

const searchTerm = ref('')
const { isSearching, searchHistory } = useSearchDebounce(
  searchTerm,
  300,
  { onSearch: performSearch }
)
</script>
```

## 🔧 Configuración Avanzada

### Cache Personalizado
```javascript
const lazyLoading = useLazyLoading({
  enableCache: true,
  cacheKey: 'operaciones-filtradas',
  fetchFunction: async (params) => {
    // Tu lógica de fetch
  }
})
```

### Virtualización con Alturas Dinámicas
```javascript
const virtualization = useVirtualization({
  estimatedItemHeight: 60,
  getItemHeight: (item, index) => {
    // Calcular altura basada en contenido
    return item.hasDetails ? 120 : 60
  }
})
```

### Infinite Scroll Híbrido
```javascript
const infiniteScroll = useAdvancedInfiniteScroll({
  preferIntersectionObserver: true,
  fallbackToScrollPosition: true,
  threshold: 100 // píxeles desde el final
})
```

## 🧪 Testing

Los composables incluyen verificaciones básicas. Para testing completo:

```bash
# Instalar dependencias de testing
npm install --save-dev vitest @vue/test-utils

# Ejecutar tests
npm run test
```

## 📈 Métricas de Rendimiento

Estos composables están diseñados para cumplir con las siguientes métricas:

- **Tiempo de carga inicial**: < 500ms
- **Tiempo de búsqueda**: < 200ms  
- **Memoria utilizada**: < 100MB para 5000 registros
- **FPS durante scroll**: 60fps consistente
- **Elementos DOM**: Máximo 100 elementos visibles simultáneamente

## 🔄 Próximos Pasos

1. **Integrar en vistas de operaciones** (Task 4.1, 4.2, 4.3)
2. **Implementar en vistas de procesos** (Task 6.1)
3. **Crear componentes reutilizables** (Task 2.1, 2.2, 2.3)
4. **Optimizar stores de Pinia** (Task 3.1, 3.2, 3.3)

---

*Estos composables forman la base para todas las optimizaciones de rendimiento del sistema. Cada uno está diseñado para ser reutilizable, testeable y fácil de integrar.*
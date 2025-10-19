<template>
  <div class="skeleton-loader">
    <!-- Table variant -->
    <template v-if="variant === 'table'">
      <v-skeleton-loader
        v-for="row in rows"
        :key="`table-row-${row}`"
        type="table-row"
        class="mb-2"
        :loading="true"
        :animation="animation"
      />
    </template>

    <!-- Card variant -->
    <template v-else-if="variant === 'card'">
      <v-row>
        <v-col
          v-for="card in columns"
          :key="`card-${card}`"
          :cols="12 / columns"
        >
          <v-skeleton-loader
            type="card"
            :loading="true"
            :animation="animation"
            class="mb-4"
          />
        </v-col>
      </v-row>
    </template>

    <!-- Modal variant -->
    <template v-else-if="variant === 'modal'">
      <v-skeleton-loader
        type="card-heading, divider, list-item-three-line, actions"
        :loading="true"
        :animation="animation"
        class="mb-4"
      />
      <v-skeleton-loader
        v-for="section in rows"
        :key="`modal-section-${section}`"
        type="list-item-two-line, divider"
        :loading="true"
        :animation="animation"
        class="mb-2"
      />
    </template>

    <!-- List variant -->
    <template v-else-if="variant === 'list'">
      <v-skeleton-loader
        v-for="item in rows"
        :key="`list-item-${item}`"
        type="list-item-avatar-three-line"
        :loading="true"
        :animation="animation"
        class="mb-1"
      />
    </template>

    <!-- Dashboard variant -->
    <template v-else-if="variant === 'dashboard'">
      <!-- KPI Cards -->
      <v-row class="mb-4">
        <v-col
          v-for="kpi in 4"
          :key="`kpi-${kpi}`"
          cols="12"
          sm="6"
          md="3"
        >
          <v-skeleton-loader
            type="card-heading, text"
            :loading="true"
            :animation="animation"
          />
        </v-col>
      </v-row>
      
      <!-- Charts -->
      <v-row>
        <v-col cols="12" md="8">
          <v-skeleton-loader
            type="card-heading, image"
            :loading="true"
            :animation="animation"
            height="300"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-skeleton-loader
            type="card-heading, list-item-three-line, list-item-three-line, list-item-three-line"
            :loading="true"
            :animation="animation"
          />
        </v-col>
      </v-row>
    </template>

    <!-- Custom variant -->
    <template v-else-if="variant === 'custom'">
      <v-skeleton-loader
        :type="customType"
        :loading="true"
        :animation="animation"
        :height="height"
        :width="width"
      />
    </template>

    <!-- Default table variant -->
    <template v-else>
      <v-skeleton-loader
        v-for="row in rows"
        :key="`default-row-${row}`"
        type="table-row"
        class="mb-2"
        :loading="true"
        :animation="animation"
      />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /**
   * Tipo de skeleton loader
   * @type {'table' | 'card' | 'modal' | 'list' | 'dashboard' | 'custom'}
   */
  variant: {
    type: String,
    default: 'table',
    validator: (value) => ['table', 'card', 'modal', 'list', 'dashboard', 'custom'].includes(value)
  },
  
  /**
   * Número de filas/elementos a mostrar
   */
  rows: {
    type: Number,
    default: 5
  },
  
  /**
   * Número de columnas (para variant card)
   */
  columns: {
    type: Number,
    default: 3
  },
  
  /**
   * Tipo de animación
   * @type {'wave' | 'pulse' | 'none'}
   */
  animation: {
    type: String,
    default: 'wave',
    validator: (value) => ['wave', 'pulse', 'none'].includes(value)
  },
  
  /**
   * Tipo personalizado para variant custom
   */
  customType: {
    type: String,
    default: 'card'
  },
  
  /**
   * Altura personalizada
   */
  height: {
    type: [String, Number],
    default: undefined
  },
  
  /**
   * Ancho personalizado
   */
  width: {
    type: [String, Number],
    default: undefined
  }
})

// Computed para validar props
const validatedRows = computed(() => Math.max(1, props.rows))
const validatedColumns = computed(() => Math.max(1, Math.min(12, props.columns)))
</script>

<style scoped>
.skeleton-loader {
  width: 100%;
}

/* Animaciones personalizadas */
.skeleton-loader :deep(.v-skeleton-loader__bone) {
  transition: all 0.3s ease;
}

/* Variante wave más suave */
.skeleton-loader :deep(.v-skeleton-loader--wave .v-skeleton-loader__bone::after) {
  animation-duration: 2s;
  animation-timing-function: ease-in-out;
}

/* Variante pulse más sutil */
.skeleton-loader :deep(.v-skeleton-loader--pulse .v-skeleton-loader__bone) {
  animation-duration: 1.5s;
  animation-timing-function: ease-in-out;
}
</style>
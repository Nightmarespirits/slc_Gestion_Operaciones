import { defineStore } from 'pinia';
import axios from 'axios';
import procesoService from '../services/procesoService';
import { dateTimeZConverter } from '../utils/dateTimeZConverter';

export const useProcesosStore = defineStore('procesos', {
    state: () => ({
        // Cache unificado por tipo - Simplificado
        cache: new Map(), // Map<tipo, CacheEntry>

        // Cache de detalles de proceso (lazy loading)
        details: new Map(), // Map<string, ProcessDetails>

        // Estados de loading granulares
        loading: {
            initial: false,
            loadMore: false,
            details: false,
            updating: false,
            search: false
        },

        // Filtros activos - Simplificado
        activeFilters: {
            tipo: null,
            search: '',
            responsable: null,
            estado: null,
            sede: null,
            dateRange: null
        },

        // Configuración unificada
        config: {
            pageSize: 30,
            cacheTTL: 5 * 60 * 1000, // 5 minutos
            detailsTTL: 10 * 60 * 1000, // 10 minutos
            preloadThreshold: 5
        },

        // Tipos de proceso disponibles
        tiposProceso: ['lavado', 'secado', 'doblado', 'planchado', 'tenido', 'cc']
    }),

    getters: {
        // Obtener entrada de cache por tipo
        getCacheEntry: (state) => (tipo) => {
            const entry = state.cache.get(tipo)
            if (!entry) return null

            // Verificar TTL
            const now = Date.now()
            if (now - entry.timestamp > state.config.cacheTTL) {
                state.cache.delete(tipo)
                return null
            }

            return entry
        },

        // Obtener procesos por tipo (sin filtros)
        getByType: (state) => (tipo) => {
            const entry = state.cache.get(tipo)
            if (!entry) return []

            return [...entry.items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        },

        // Obtener procesos filtrados
        filteredProcesos: (state) => {
            const tipo = state.activeFilters.tipo
            if (!tipo) return []

            const entry = state.cache.get(tipo)
            if (!entry) return []

            let items = [...entry.items]
            const filters = state.activeFilters

            // Aplicar filtros
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase()
                items = items.filter(item =>
                    item.detalles?.some(detalle =>
                        detalle.numOrden?.toLowerCase().includes(searchTerm)
                    ) ||
                    item.responsable?.nombre?.toLowerCase().includes(searchTerm)
                )
            }

            if (filters.responsable) {
                items = items.filter(item =>
                    item.responsable?.nombre === filters.responsable
                )
            }

            if (filters.estado !== null && filters.estado !== undefined) {
                items = items.filter(item => item.estado === filters.estado)
            }

            if (filters.sede) {
                items = items.filter(item =>
                    item.sede?.nombre === filters.sede
                )
            }

            return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        },

        // Obtener proceso por ID
        getById: (state) => (id) => {
            for (const entry of state.cache.values()) {
                const item = entry.items.find(item => item.id === id || item._id === id)
                if (item) return item
            }
            return null
        },

        // Obtener detalles de proceso por ID
        getDetailsById: (state) => (id) => {
            const details = state.details.get(id)
            if (!details) return null

            // Verificar TTL de detalles
            const now = Date.now()
            if (now - details.lastFetch > state.config.detailsTTL) {
                state.details.delete(id)
                return null
            }

            return details
        },

        // Verificar si el cache de un tipo es válido
        isCacheValid: (state) => (tipo) => {
            const entry = state.cache.get(tipo)
            if (!entry) return false

            const now = Date.now()
            return (now - entry.timestamp) < state.config.cacheTTL
        },

        // Opciones para filtros
        getFilterOptions: (state) => (tipo) => {
            const entry = state.cache.get(tipo)
            if (!entry) return { responsables: [], sedes: [] }

            const responsables = [...new Set(
                entry.items
                    .map(item => item.responsable?.nombre)
                    .filter(Boolean)
            )].sort()

            const sedes = [...new Set(
                entry.items
                    .map(item => item.sede?.nombre)
                    .filter(Boolean)
            )].sort()

            return { responsables, sedes }
        },

        // Responsables únicos para filtros
        uniqueResponsables: (state) => {
            const tipo = state.activeFilters.tipo
            if (!tipo) return []

            const entry = state.cache.get(tipo)
            if (!entry) return []

            return [...new Set(
                entry.items
                    .map(item => item.responsable?.nombre)
                    .filter(Boolean)
            )].sort()
        },

        // Sedes únicas para filtros
        uniqueSedes: (state) => {
            const tipo = state.activeFilters.tipo
            if (!tipo) return []

            const entry = state.cache.get(tipo)
            if (!entry) return []

            return [...new Set(
                entry.items
                    .map(item => item.sede?.nombre)
                    .filter(Boolean)
            )].sort()
        },

        // Estadísticas por tipo de proceso
        statsByType: (state) => {
            const stats = new Map()

            for (const tipo of state.tiposProceso) {
                const entry = state.cache.get(tipo)
                const procesos = entry ? entry.items : []

                const completados = procesos.filter(p => p.estado === true).length
                const pendientes = procesos.filter(p => p.estado === false).length

                stats.set(tipo, {
                    total: procesos.length,
                    completados,
                    pendientes,
                    porcentajeCompletado: procesos.length > 0 ? Math.round((completados / procesos.length) * 100) : 0
                })
            }

            return stats
        }
    },

    actions: {
        // Cargar procesos por tipo - Método principal simplificado
        async loadProcesosByType(tipo, options = {}) {
            const {
                page = 1,
                limit = this.config.pageSize,
                forceRefresh = false
            } = options

            // Verificar cache
            if (!forceRefresh && this.isCacheValid(tipo)) {
                return this.getByType(tipo)
            }

            this.loading.initial = true

            try {
                // Intentar endpoint paginado primero
                let response
                try {
                    response = await axios.get(
                        `${import.meta.env.VITE_API_URL}/procesos/tipo/${tipo}/paginated`,
                        { params: { page, limit } }
                    )
                } catch (error) {
                    // Fallback a endpoint existente
                    if (error.response?.status === 404) {
                        response = await axios.get(
                            `${import.meta.env.VITE_API_URL}/procesos/tipo/${tipo}`
                        )
                        response.data = { data: response.data, pagination: { hasMore: false } }
                    } else {
                        throw error
                    }
                }

                const data = response.data.data || response.data
                const formattedData = this.formatProcesosData(data)

                // Actualizar cache
                this.cache.set(tipo, {
                    items: formattedData,
                    timestamp: Date.now(),
                    pagination: {
                        total: formattedData.length,
                        loaded: formattedData.length,
                        hasMore: false
                    }
                })

                return this.getByType(tipo)

            } catch (error) {
                console.error(`Error loading ${tipo} processes:`, error)
                throw error
            } finally {
                this.loading.initial = false
            }
        },

        // Método de compatibilidad con el código existente
        async fetchProcesosByType(tipo, options = {}) {
            return this.loadProcesosByType(tipo, options)
        },

        // Cargar detalles de proceso bajo demanda
        async fetchProcesoDetails(id) {
            // Verificar si ya tenemos detalles válidos
            const existingDetails = this.getDetailsById(id)
            if (existingDetails) {
                return existingDetails
            }

            this.loading.details = true

            try {
                const result = await procesoService.getProcesoWithStatus(id)

                if (!result.success) {
                    throw new Error(result.error)
                }

                const formatted = this.formatProcesoDetails(result.data)

                // Cachear detalles
                this.details.set(id, {
                    ...formatted,
                    lastFetch: Date.now()
                })

                return formatted

            } catch (error) {
                console.error('Error fetching process details:', error)
                throw error
            } finally {
                this.loading.details = false
            }
        },

        // Buscar procesos - Simplificado
        async searchProcesos(searchTerm, tipo = null) {
            this.activeFilters.search = searchTerm
            if (tipo) this.activeFilters.tipo = tipo

            // Si no hay datos en cache, cargarlos
            if (!this.isCacheValid(tipo)) {
                await this.loadProcesosByType(tipo)
            }

            return this.filteredProcesos
        },

        // Aplicar filtros - Simplificado
        applyFilters(newFilters) {
            Object.assign(this.activeFilters, newFilters)
            return this.filteredProcesos
        },

        // Limpiar filtros
        clearFilters() {
            this.activeFilters = {
                tipo: null,
                search: '',
                responsable: null,
                estado: null,
                sede: null,
                dateRange: null
            }
            return this.filteredProcesos
        },

        // Actualizar estado de detalle con optimistic update
        async updateDetailStatus(procesoId, detalleId, estado) {
            this.loading.updating = true

            // Optimistic update
            const proceso = this.getById(procesoId)
            const details = this.getDetailsById(procesoId)

            if (details) {
                const detalle = details.detalles.find(d => d._id === detalleId)
                if (detalle) {
                    const oldEstado = detalle.estado
                    detalle.estado = estado

                    try {
                        const result = await procesoService.updateDetailStatus(procesoId, detalleId, estado)

                        if (!result.success) {
                            // Revertir optimistic update
                            detalle.estado = oldEstado
                            throw new Error(result.error)
                        }

                        // Actualizar proceso completo si es necesario
                        if (result.data) {
                            this.updateProcesoInCache(procesoId, result.data)
                        }

                        return result

                    } catch (error) {
                        // Revertir optimistic update
                        detalle.estado = oldEstado
                        throw error
                    }
                }
            }

            try {
                const result = await procesoService.updateDetailStatus(procesoId, detalleId, estado)

                if (result.success && result.data) {
                    this.updateProcesoInCache(procesoId, result.data)
                }

                return result

            } catch (error) {
                console.error('Error updating detail status:', error)
                throw error
            } finally {
                this.loading.updating = false
            }
        },

        // Actualización batch de estados
        async batchUpdateDetailStatus(procesoId, updates) {
            this.loading.updating = true

            try {
                const result = await procesoService.batchUpdateDetailStatus(procesoId, updates)

                if (result.success && result.data) {
                    this.updateProcesoInCache(procesoId, result.data)
                }

                return result

            } catch (error) {
                console.error('Error batch updating detail statuses:', error)
                throw error
            } finally {
                this.loading.updating = false
            }
        },

        // Invalidar cache de un tipo específico
        invalidateTypeCache(tipo) {
            this.cache.delete(tipo)

            // Limpiar detalles relacionados
            for (const [id, details] of this.details) {
                if (details.tipo === tipo) {
                    this.details.delete(id)
                }
            }
        },

        // Invalidar todo el cache
        invalidateAllCache() {
            this.cache.clear()
            this.details.clear()
        },

        // Formatear datos de procesos
        formatProcesosData(procesos) {
            return procesos.map(proceso => this.formatProcesoData(proceso))
        },

        // Formatear un proceso individual
        formatProcesoData(proceso) {
            return {
                id: proceso._id,
                _id: proceso._id,
                tipo: proceso.tipo,
                fecha: dateTimeZConverter(proceso.fecha) || proceso.fecha,
                hora: proceso.hora,
                responsable: proceso.responsable ? {
                    id: proceso.responsable._id,
                    _id: proceso.responsable._id,
                    nombre: `${proceso.responsable.nombres} ${proceso.responsable.apellidos}`,
                    nombres: proceso.responsable.nombres,
                    apellidos: proceso.responsable.apellidos
                } : null,
                sede: proceso.sede ? {
                    id: proceso.sede._id,
                    _id: proceso.sede._id,
                    nombre: proceso.sede.nombre
                } : null,
                detalles: proceso.detalles?.map(detalle => ({
                    _id: detalle._id,
                    numOrden: detalle.numOrden,
                    maquina: detalle.maquina ? {
                        _id: detalle.maquina._id,
                        marca: detalle.maquina.marca,
                        nombre: detalle.maquina.nombre
                    } : null,
                    cantidad: detalle.cantidad,
                    colorMarcado: detalle.colorMarcado,
                    obs: detalle.obs,
                    estado: detalle.estado
                })) || [],
                estado: proceso.estado,
                isSequential: proceso.isSequential,
                operacion: proceso.operacion,
                createdAt: proceso.createdAt,
                updatedAt: proceso.updatedAt,
                __v: proceso.__v,
                estadoCalculado: proceso.estadoCalculado,
                detallesCount: proceso.detalles?.length || 0,
                completedCount: proceso.detalles?.filter(d => d.estado).length || 0,
                progreso: proceso.detalles?.length > 0 ?
                    Math.round((proceso.detalles.filter(d => d.estado).length / proceso.detalles.length) * 100) : 0,
                lastUpdated: Date.now()
            }
        },

        // Formatear detalles de proceso
        formatProcesoDetails(proceso) {
            return {
                ...this.formatProcesoData(proceso),
                detalles: proceso.detalles?.map(detalle => ({
                    _id: detalle._id,
                    numOrden: detalle.numOrden,
                    estado: detalle.estado,
                    observaciones: detalle.observaciones,
                    fechaCreacion: detalle.fechaCreacion,
                    fechaActualizacion: detalle.fechaActualizacion,
                    colorMarcado: detalle.colorMarcado,
                    cantidad: detalle.cantidad,
                    obs: detalle.obs,
                    maquina: detalle.maquina
                })) || []
            }
        },

        // Actualizar proceso en cache
        updateProcesoInCache(id, updatedData) {
            // Buscar en qué cache está el proceso
            for (const [tipo, entry] of this.cache) {
                const index = entry.items.findIndex(item => item.id === id || item._id === id)
                if (index !== -1) {
                    const updated = this.formatProcesoData(updatedData)
                    entry.items[index] = updated

                    // Actualizar detalles si existen
                    if (updatedData.detalles) {
                        const detailsFormatted = this.formatProcesoDetails(updatedData)
                        this.details.set(id, {
                            ...detailsFormatted,
                            lastFetch: Date.now()
                        })
                    }
                    break
                }
            }
        },

        // Agregar nuevo proceso
        addProceso(proceso) {
            const formatted = this.formatProcesoData(proceso)
            const tipo = formatted.tipo

            const entry = this.cache.get(tipo)
            if (entry) {
                entry.items.unshift(formatted) // Agregar al inicio
            }
        },

        // Eliminar proceso
        removeProceso(id) {
            for (const [tipo, entry] of this.cache) {
                const index = entry.items.findIndex(item => item.id === id || item._id === id)
                if (index !== -1) {
                    entry.items.splice(index, 1)
                    this.details.delete(id)
                    break
                }
            }
        }
    }
});
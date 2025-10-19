import { defineStore } from 'pinia';
import axios from 'axios';
import { dateTimeZConverter } from '../utils/dateTimeZConverter';

export const useOperacionesStore = defineStore('operaciones', {
    state: () => ({
        // Cache de operaciones por ID usando Map para mejor performance
        items: new Map(),

        // Sistema de paginación con estado persistente
        pagination: {
            page: 1,
            limit: 50,
            total: 0,
            hasMore: true,
            lastFetch: null
        },

        // Filtros aplicados actualmente
        filters: {
            search: '',
            estado: null, // null = todas, true = finalizadas, false = pendientes
            dateRange: null,
            currentStage: null
        },

        // Estados de loading granulares
        loading: {
            initial: false,
            loadMore: false,
            search: false,
            details: false
        },

        // Sistema de caché con timestamps para invalidación
        cache: {
            lastUpdate: null,
            ttl: 5 * 60 * 1000, // 5 minutos en milliseconds
            invalidationTriggers: new Set()
        },

        // Índices para búsqueda optimizada
        indexes: {
            byEstado: new Map(), // Map<boolean, Set<string>>
            byOrden: new Map(),  // Map<string, Set<string>>
            byStage: new Map()   // Map<string, Set<string>>
        }
    }),

    getters: {
        // Obtener operaciones paginadas según filtros actuales
        paginatedItems: (state) => {
            let filteredIds = Array.from(state.items.keys());

            // Aplicar filtros usando índices
            if (state.filters.estado !== null) {
                const estadoIds = state.indexes.byEstado.get(state.filters.estado) || new Set();
                filteredIds = filteredIds.filter(id => estadoIds.has(id));
            }

            if (state.filters.search) {
                const searchTerm = state.filters.search.toLowerCase();
                const matchingIds = new Set();

                // Buscar en índice de órdenes
                for (const [orden, operacionIds] of state.indexes.byOrden) {
                    /*
                    if (orden.toLowerCase().includes(searchTerm)) {
                        operacionIds.forEach(id => matchingIds.add(id));
                    }*/
                }

                filteredIds = filteredIds.filter(id => matchingIds.has(id));
            }

            if (state.filters.currentStage) {
                const stageIds = state.indexes.byStage.get(state.filters.currentStage) || new Set();
                filteredIds = filteredIds.filter(id => stageIds.has(id));
            }

            // Convertir IDs a objetos y ordenar
            return filteredIds
                .map(id => state.items.get(id))
                .filter(Boolean)
                .sort((a, b) => new Date(b.fechas.fecCreacion) - new Date(a.fechas.fecCreacion));
        },

        // Obtener operación por ID
        getById: (state) => (id) => {
            return state.items.get(id);
        },

        // Verificar si el caché es válido
        isCacheValid: (state) => {
            if (!state.cache.lastUpdate) return false;
            const now = Date.now();
            return (now - state.cache.lastUpdate) < state.cache.ttl;
        },

        // Estadísticas rápidas
        stats: (state) => {
            const total = state.items.size;
            const finalizadas = state.indexes.byEstado.get(true)?.size || 0;
            const pendientes = state.indexes.byEstado.get(false)?.size || 0;

            return {
                total,
                finalizadas,
                pendientes,
                porcentajeCompletado: total > 0 ? Math.round((finalizadas / total) * 100) : 0
            };
        }
    },

    actions: {
        // Cargar operaciones con paginación y caché inteligente
        async fetchOperaciones(options = {}) {
            const {
                page = 1,
                limit = this.pagination.limit,
                forceRefresh = false,
                filters = {}
            } = options;

            // Verificar si necesitamos cargar datos
            if (!forceRefresh && this.isCacheValid && this.items.size > 0) {
                return this.paginatedItems;
            }

            // Determinar tipo de loading
            const isInitialLoad = this.items.size === 0;
            const isSearch = Object.keys(filters).length > 0;

            if (isInitialLoad) {
                this.loading.initial = true;
            } else if (isSearch) {
                this.loading.search = true;
            } else {
                this.loading.loadMore = true;
            }

            try {
                // Construir URL con parámetros
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: limit.toString(),
                    ...filters
                });

                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/operacion/paginated?${params}`
                );

                // Validar estructura de respuesta
                if (!response || !response.data) {
                    console.error('Invalid API response:', response);
                    throw new Error('Respuesta de API inválida');
                }

                // Manejar diferentes estructuras de respuesta
                let data, paginationInfo;

                if (response.data.data && response.data.meta) {
                    // Estructura con meta (paginada)
                    data = response.data.data;
                    paginationInfo = response.data.meta;
                } else if (Array.isArray(response.data)) {
                    // Estructura simple (array directo)
                    data = response.data;
                    paginationInfo = {
                        total: response.data.length,
                        hasNextPage: false,
                        currentPage: page
                    };
                } else {
                    // Fallback para otras estructuras
                    data = response.data.operaciones || response.data.items || [];
                    paginationInfo = {
                        total: response.data.total || data.length,
                        hasNextPage: response.data.hasNextPage || false,
                        currentPage: page
                    };
                }

                // Procesar y cachear datos
                const formattedData = this.formatOperacionesData(data);
                this.cacheOperaciones(formattedData, page === 1);

                // Actualizar paginación con valores seguros
                this.pagination = {
                    ...this.pagination,
                    page,
                    total: paginationInfo?.total || 0,
                    hasMore: paginationInfo?.hasNextPage || false,
                    lastFetch: Date.now()
                };

                // Actualizar caché timestamp
                this.cache.lastUpdate = Date.now();

                return this.paginatedItems;

            } catch (error) {
                console.error('Error fetching operaciones:', error);

                // Fallback a endpoint existente si el paginado no existe
                if (error.response?.status === 404) {
                    return this.fetchOperacionesFallback(filters);
                }

                throw error;
            } finally {
                this.loading.initial = false;
                this.loading.loadMore = false;
                this.loading.search = false;
            }
        },

        // Fallback para endpoints existentes
        async fetchOperacionesFallback(filters = {}) {
            this.loading.initial = true;

            try {
                let url = `${import.meta.env.VITE_API_URL}/operacion/all`;

                // Usar endpoints específicos si hay filtros
                if (filters.estado === false) {
                    url = `${import.meta.env.VITE_API_URL}/operacion/estado/false`;
                } else if (filters.estado === true) {
                    url = `${import.meta.env.VITE_API_URL}/operacion/estado/true`;
                }

                const response = await axios.get(url);
                const formattedData = this.formatOperacionesData(response.data);

                this.cacheOperaciones(formattedData, true);
                this.cache.lastUpdate = Date.now();

                return this.paginatedItems;

            } catch (error) {
                console.error('Error in fallback fetch:', error);
                throw error;
            } finally {
                this.loading.initial = false;
            }
        },

        // Cargar más datos (infinite scroll)
        async loadMore() {
            if (!this.pagination.hasMore || this.loading.loadMore) {
                return;
            }

            const nextPage = this.pagination.page + 1;
            return this.fetchOperaciones({
                page: nextPage,
                filters: this.filters
            });
        },

        // Buscar operaciones con debounce
        async searchOperaciones(searchTerm, debounceMs = 300) {
            // Cancelar búsqueda anterior si existe
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }

            return new Promise((resolve) => {
                this.searchTimeout = setTimeout(async () => {
                    this.filters.search = searchTerm;

                    if (!searchTerm.trim()) {
                        resolve(this.paginatedItems);
                        return;
                    }

                    try {
                        const results = await this.fetchOperaciones({
                            page: 1,
                            filters: { ...this.filters, search: searchTerm }
                        });
                        resolve(results);
                    } catch (error) {
                        console.error('Search error:', error);
                        resolve([]);
                    }
                }, debounceMs);
            });
        },

        // Obtener detalles de una operación específica
        async fetchOperacionDetails(id) {
            // Verificar si ya tenemos los detalles en caché
            const cached = this.items.get(id);
            if (cached && cached.hasFullDetails) {
                return cached;
            }

            this.loading.details = true;

            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/operacion/id/${id}`
                );

                const formatted = this.formatOperacionData(response.data, true);
                this.cacheOperacion(formatted);

                return formatted;

            } catch (error) {
                console.error('Error fetching operation details:', error);

                // Fallback: devolver datos básicos si existen en caché
                if (cached) {
                    return {
                        ...cached,
                        procesos: cached.procesos?.map(proceso => ({
                            ...proceso,
                            detalles: proceso.detalles || []
                        })) || [],
                        hasFullDetails: false
                    };
                }

                throw error;
            } finally {
                this.loading.details = false;
            }
        },

        // Aplicar filtros
        applyFilters(newFilters) {
            this.filters = { ...this.filters, ...newFilters };
            this.pagination.page = 1;

            return this.fetchOperaciones({
                page: 1,
                filters: this.filters,
                forceRefresh: true
            });
        },

        // Limpiar filtros
        clearFilters() {
            this.filters = {
                search: '',
                estado: null,
                dateRange: null,
                currentStage: null
            };
            this.pagination.page = 1;

            return this.fetchOperaciones({
                page: 1,
                forceRefresh: true
            });
        },

        // Invalidar caché
        invalidateCache(trigger = 'manual') {
            this.cache.lastUpdate = null;
            this.cache.invalidationTriggers.add({
                trigger,
                timestamp: Date.now()
            });

            // Limpiar caché si hay demasiados triggers
            if (this.cache.invalidationTriggers.size > 10) {
                this.cache.invalidationTriggers.clear();
            }
        },

        // Actualizar operación en caché
        updateOperacion(id, updates) {
            const existing = this.items.get(id);
            if (existing) {
                const updated = { ...existing, ...updates };
                this.cacheOperacion(updated);
                this.rebuildIndexes();
            }
        },

        // Eliminar operación del caché
        removeOperacion(id) {
            this.items.delete(id);
            this.rebuildIndexes();
        },

        // Formatear datos de operaciones
        formatOperacionesData(operaciones) {
            return operaciones.map(operacion => this.formatOperacionData(operacion));
        },

        // Formatear una operación individual
        formatOperacionData(operacion, includeFullDetails = false) {
            const tickets = this.getAllTickets(operacion);

            return {
                id: operacion._id,
                ordenes: tickets,
                procesos: operacion.procesos?.map(proceso => ({
                    id: proceso._id,
                    tipo: proceso.tipo,
                    fecha: dateTimeZConverter(proceso.fecha) || proceso.fecha,
                    responsable: proceso.responsable ?
                        `${proceso.responsable.nombres} ${proceso.responsable.apellidos}` :
                        'No asignado',
                    detalles: includeFullDetails ? proceso.detalles : undefined
                })) || [],
                fechas: {
                    fecCreacion: operacion.createdAt || '',
                    inicio: dateTimeZConverter(operacion?.fecInicio) || operacion.fecInicio || '',
                    final: dateTimeZConverter(operacion?.fecFinal) || operacion.fecFinal || ''
                },
                estadoOperacion: operacion.estadoOperacion,
                currentStage: operacion.currentStage,
                hasFullDetails: includeFullDetails,
                lastUpdated: Date.now()
            };
        },

        // Obtener todos los tickets de una operación
        getAllTickets(operacion) {
            const tickets = new Set();

            operacion.procesos?.forEach(proceso => {
                proceso.detalles?.forEach(detalle => {
                    if (detalle.numOrden) {
                        tickets.add(detalle.numOrden);
                    }
                });
            });

            return Array.from(tickets);
        },

        // Cachear operaciones y reconstruir índices
        cacheOperaciones(operaciones, clearExisting = false) {
            if (clearExisting) {
                this.items.clear();
            }

            operaciones.forEach(operacion => {
                this.cacheOperacion(operacion);
            });

            this.rebuildIndexes();
        },

        // Cachear una operación individual
        cacheOperacion(operacion) {
            this.items.set(operacion.id, operacion);
        },

        // Reconstruir índices para búsqueda optimizada
        rebuildIndexes() {
            // Limpiar índices existentes
            this.indexes.byEstado.clear();
            this.indexes.byOrden.clear();
            this.indexes.byStage.clear();

            // Reconstruir índices
            for (const [id, operacion] of this.items) {
                // Índice por estado
                const estadoSet = this.indexes.byEstado.get(operacion.estadoOperacion) || new Set();
                estadoSet.add(id);
                this.indexes.byEstado.set(operacion.estadoOperacion, estadoSet);

                // Índice por órdenes
                operacion.ordenes.forEach(orden => {
                    const ordenSet = this.indexes.byOrden.get(orden) || new Set();
                    ordenSet.add(id);
                    this.indexes.byOrden.set(orden, ordenSet);
                });

                // Índice por stage
                if (operacion.currentStage) {
                    const stageSet = this.indexes.byStage.get(operacion.currentStage) || new Set();
                    stageSet.add(id);
                    this.indexes.byStage.set(operacion.currentStage, stageSet);
                }
            }
        }
    }
});
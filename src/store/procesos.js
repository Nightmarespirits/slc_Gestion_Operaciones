import { defineStore } from 'pinia';
import axios from 'axios';
import procesoService from '../services/procesoService';
import { dateTimeZConverter } from '../utils/dateTimeZConverter';

export const useProcesosStore = defineStore('procesos', {
    state: () => ({
        // Cache inteligente para procesos por tipo
        items: new Map(), // Map<string, ProcessData>
        
        // Cache por tipo de proceso para acceso rápido
        byType: new Map(), // Map<string, Set<string>>
        
        // Cache de detalles de proceso (lazy loading)
        details: new Map(), // Map<string, ProcessDetails>
        
        // Sistema de filtros optimizado con índices en memoria
        filters: {
            tipo: null,
            responsable: null,
            estado: null,
            sede: null,
            dateRange: null,
            numOrden: ''
        },
        
        // Estados de loading granulares
        loading: {
            initial: false,
            loadMore: false,
            details: false,
            updating: false,
            search: false
        },
        
        // Paginación por tipo de proceso
        pagination: new Map(), // Map<string, PaginationInfo>
        
        // Índices optimizados para filtrado rápido
        indexes: {
            byResponsable: new Map(), // Map<string, Set<string>>
            byEstado: new Map(),      // Map<boolean, Set<string>>
            bySede: new Map(),        // Map<string, Set<string>>
            byOrden: new Map(),       // Map<string, Set<string>>
            byDate: new Map()         // Map<string, Set<string>>
        },
        
        // Cache con TTL
        cache: {
            lastUpdate: new Map(), // Map<string, timestamp>
            ttl: 3 * 60 * 1000,   // 3 minutos
            detailsTtl: 10 * 60 * 1000 // 10 minutos para detalles
        },
        
        // Tipos de proceso disponibles
        tiposProceso: ['lavado', 'secado', 'doblado', 'planchado', 'tenido', 'cc'],
        
        // Configuración de lazy loading
        lazyConfig: {
            pageSize: 30,
            preloadThreshold: 5 // Cargar más cuando quedan 5 elementos
        }
    }),

    getters: {
        // Obtener procesos filtrados por tipo
        getByType: (state) => (tipo) => {
            const typeIds = state.byType.get(tipo) || new Set();
            return Array.from(typeIds)
                .map(id => state.items.get(id))
                .filter(Boolean)
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        },
        
        // Obtener procesos filtrados según filtros actuales
        filteredProcesos: (state) => {
            let filteredIds = Array.from(state.items.keys());
            
            // Aplicar filtros usando índices
            if (state.filters.tipo) {
                const typeIds = state.byType.get(state.filters.tipo) || new Set();
                filteredIds = filteredIds.filter(id => typeIds.has(id));
            }
            
            if (state.filters.responsable) {
                const responsableIds = state.indexes.byResponsable.get(state.filters.responsable) || new Set();
                filteredIds = filteredIds.filter(id => responsableIds.has(id));
            }
            
            if (state.filters.estado !== null) {
                const estadoIds = state.indexes.byEstado.get(state.filters.estado) || new Set();
                filteredIds = filteredIds.filter(id => estadoIds.has(id));
            }
            
            if (state.filters.sede) {
                const sedeIds = state.indexes.bySede.get(state.filters.sede) || new Set();
                filteredIds = filteredIds.filter(id => sedeIds.has(id));
            }
            
            if (state.filters.numOrden) {
                const searchTerm = state.filters.numOrden.toLowerCase();
                const matchingIds = new Set();
                
                for (const [orden, procesoIds] of state.indexes.byOrden) {
                    if (orden.toLowerCase().includes(searchTerm)) {
                        procesoIds.forEach(id => matchingIds.add(id));
                    }
                }
                
                filteredIds = filteredIds.filter(id => matchingIds.has(id));
            }
            
            // Convertir IDs a objetos
            return filteredIds
                .map(id => state.items.get(id))
                .filter(Boolean)
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        },
        
        // Obtener proceso por ID
        getById: (state) => (id) => {
            return state.items.get(id);
        },
        
        // Obtener detalles de proceso por ID
        getDetailsById: (state) => (id) => {
            return state.details.get(id);
        },
        
        // Verificar si el cache de un tipo es válido
        isCacheValid: (state) => (tipo) => {
            const lastUpdate = state.cache.lastUpdate.get(tipo);
            if (!lastUpdate) return false;
            
            const now = Date.now();
            return (now - lastUpdate) < state.cache.ttl;
        },
        
        // Verificar si los detalles están en cache y son válidos
        areDetailsValid: (state) => (id) => {
            const details = state.details.get(id);
            if (!details) return false;
            
            const now = Date.now();
            return (now - details.lastFetch) < state.cache.detailsTtl;
        },
        
        // Estadísticas por tipo de proceso
        statsByType: (state) => {
            const stats = new Map();
            
            for (const tipo of state.tiposProceso) {
                const typeIds = state.byType.get(tipo) || new Set();
                const procesos = Array.from(typeIds).map(id => state.items.get(id)).filter(Boolean);
                
                const completados = procesos.filter(p => p.estado === true).length;
                const pendientes = procesos.filter(p => p.estado === false).length;
                
                stats.set(tipo, {
                    total: procesos.length,
                    completados,
                    pendientes,
                    porcentajeCompletado: procesos.length > 0 ? Math.round((completados / procesos.length) * 100) : 0
                });
            }
            
            return stats;
        },
        
        // Responsables únicos para filtros
        uniqueResponsables: (state) => {
            return Array.from(state.indexes.byResponsable.keys()).sort();
        },
        
        // Sedes únicas para filtros
        uniqueSedes: (state) => {
            return Array.from(state.indexes.bySede.keys()).sort();
        }
    },

    actions: {
        // Cargar procesos por tipo con cache inteligente
        async fetchProcesosByType(tipo, options = {}) {
            const {
                page = 1,
                limit = this.lazyConfig.pageSize,
                forceRefresh = false
            } = options;
            
            // Verificar cache
            if (!forceRefresh && this.isCacheValid(tipo)) {
                return this.getByType(tipo);
            }
            
            this.loading.initial = true;
            
            try {
                // Intentar endpoint paginado primero
                let response;
                try {
                    response = await axios.get(
                        `${import.meta.env.VITE_API_URL}/procesos/tipo/${tipo}/paginated`,
                        { params: { page, limit } }
                    );
                } catch (error) {
                    // Fallback a endpoint existente
                    if (error.response?.status === 404) {
                        response = await axios.get(
                            `${import.meta.env.VITE_API_URL}/procesos/tipo/${tipo}`
                        );
                        response.data = { data: response.data, pagination: { hasMore: false } };
                    } else {
                        throw error;
                    }
                }
                
                const { data, pagination } = response.data;
                const formattedData = this.formatProcesosData(data);
                
                // Cachear datos
                this.cacheProcesos(formattedData, page === 1);
                
                // Actualizar paginación
                this.pagination.set(tipo, {
                    page,
                    limit,
                    hasMore: pagination?.hasMore || false,
                    total: pagination?.total || data.length
                });
                
                // Actualizar timestamp de cache
                this.cache.lastUpdate.set(tipo, Date.now());
                
                return this.getByType(tipo);
                
            } catch (error) {
                console.error(`Error fetching ${tipo} processes:`, error);
                throw error;
            } finally {
                this.loading.initial = false;
            }
        },
        
        // Cargar detalles de proceso bajo demanda
        async fetchProcesoDetails(id) {
            // Verificar si ya tenemos detalles válidos
            if (this.areDetailsValid(id)) {
                return this.getDetailsById(id);
            }
            
            this.loading.details = true;
            
            try {
                const result = await procesoService.getProcesoWithStatus(id);
                
                if (!result.success) {
                    throw new Error(result.error);
                }
                
                const formatted = this.formatProcesoDetails(result.data);
                
                // Cachear detalles
                this.details.set(id, {
                    ...formatted,
                    lastFetch: Date.now()
                });
                
                return formatted;
                
            } catch (error) {
                console.error('Error fetching process details:', error);
                throw error;
            } finally {
                this.loading.details = false;
            }
        },
        
        // Buscar procesos con debounce
        async searchProcesos(searchTerm, tipo = null, debounceMs = 300) {
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
            
            return new Promise((resolve) => {
                this.searchTimeout = setTimeout(async () => {
                    this.filters.numOrden = searchTerm;
                    if (tipo) this.filters.tipo = tipo;
                    
                    if (!searchTerm.trim()) {
                        resolve(this.filteredProcesos);
                        return;
                    }
                    
                    this.loading.search = true;
                    
                    try {
                        // Usar filtros locales si tenemos datos en cache
                        if (this.items.size > 0) {
                            resolve(this.filteredProcesos);
                        } else {
                            // Cargar datos si no los tenemos
                            await this.fetchFilteredProcesos({
                                numOrden: searchTerm,
                                tipo
                            });
                            resolve(this.filteredProcesos);
                        }
                    } catch (error) {
                        console.error('Search error:', error);
                        resolve([]);
                    } finally {
                        this.loading.search = false;
                    }
                }, debounceMs);
            });
        },
        
        // Cargar procesos filtrados
        async fetchFilteredProcesos(filters = {}) {
            this.loading.initial = true;
            
            try {
                const result = await procesoService.getFilteredProcesos(filters);
                
                if (!result.success) {
                    throw new Error(result.error);
                }
                
                const formattedData = this.formatProcesosData(result.data);
                this.cacheProcesos(formattedData, true);
                
                return this.filteredProcesos;
                
            } catch (error) {
                console.error('Error fetching filtered processes:', error);
                throw error;
            } finally {
                this.loading.initial = false;
            }
        },
        
        // Aplicar filtros
        applyFilters(newFilters) {
            this.filters = { ...this.filters, ...newFilters };
            return this.filteredProcesos;
        },
        
        // Limpiar filtros
        clearFilters() {
            this.filters = {
                tipo: null,
                responsable: null,
                estado: null,
                sede: null,
                dateRange: null,
                numOrden: ''
            };
            return this.filteredProcesos;
        },
        
        // Actualizar estado de detalle con optimistic update
        async updateDetailStatus(procesoId, detalleId, estado) {
            this.loading.updating = true;
            
            // Optimistic update
            const proceso = this.items.get(procesoId);
            const details = this.details.get(procesoId);
            
            if (details) {
                const detalle = details.detalles.find(d => d._id === detalleId);
                if (detalle) {
                    const oldEstado = detalle.estado;
                    detalle.estado = estado;
                    
                    try {
                        const result = await procesoService.updateDetailStatus(procesoId, detalleId, estado);
                        
                        if (!result.success) {
                            // Revertir optimistic update
                            detalle.estado = oldEstado;
                            throw new Error(result.error);
                        }
                        
                        // Actualizar proceso completo si es necesario
                        if (result.data) {
                            this.updateProcesoInCache(procesoId, result.data);
                        }
                        
                        return result;
                        
                    } catch (error) {
                        // Revertir optimistic update
                        detalle.estado = oldEstado;
                        throw error;
                    }
                }
            }
            
            try {
                const result = await procesoService.updateDetailStatus(procesoId, detalleId, estado);
                
                if (result.success && result.data) {
                    this.updateProcesoInCache(procesoId, result.data);
                }
                
                return result;
                
            } catch (error) {
                console.error('Error updating detail status:', error);
                throw error;
            } finally {
                this.loading.updating = false;
            }
        },
        
        // Actualización batch de estados
        async batchUpdateDetailStatus(procesoId, updates) {
            this.loading.updating = true;
            
            try {
                const result = await procesoService.batchUpdateDetailStatus(procesoId, updates);
                
                if (result.success && result.data) {
                    this.updateProcesoInCache(procesoId, result.data);
                }
                
                return result;
                
            } catch (error) {
                console.error('Error batch updating detail statuses:', error);
                throw error;
            } finally {
                this.loading.updating = false;
            }
        },
        
        // Invalidar cache de un tipo específico
        invalidateTypeCache(tipo) {
            this.cache.lastUpdate.delete(tipo);
            
            // Remover procesos de este tipo del cache
            const typeIds = this.byType.get(tipo) || new Set();
            typeIds.forEach(id => {
                this.items.delete(id);
                this.details.delete(id);
            });
            
            this.byType.delete(tipo);
            this.rebuildIndexes();
        },
        
        // Formatear datos de procesos
        formatProcesosData(procesos) {
            return procesos.map(proceso => this.formatProcesoData(proceso));
        },
        
        // Formatear un proceso individual
        formatProcesoData(proceso) {
            return {
                id: proceso._id,
                tipo: proceso.tipo,
                fecha: dateTimeZConverter(proceso.fecha) || proceso.fecha,
                responsable: proceso.responsable ? {
                    id: proceso.responsable._id,
                    nombre: `${proceso.responsable.nombres} ${proceso.responsable.apellidos}`,
                    nombres: proceso.responsable.nombres,
                    apellidos: proceso.responsable.apellidos
                } : null,
                sede: proceso.sede ? {
                    id: proceso.sede._id,
                    nombre: proceso.sede.nombre
                } : null,
                estado: proceso.estado,
                operacion: proceso.operacion,
                detallesCount: proceso.detalles?.length || 0,
                completedCount: proceso.detalles?.filter(d => d.estado).length || 0,
                progreso: proceso.detalles?.length > 0 ? 
                    Math.round((proceso.detalles.filter(d => d.estado).length / proceso.detalles.length) * 100) : 0,
                lastUpdated: Date.now()
            };
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
                    fechaActualizacion: detalle.fechaActualizacion
                })) || []
            };
        },
        
        // Cachear procesos y reconstruir índices
        cacheProcesos(procesos, clearExisting = false) {
            if (clearExisting) {
                this.items.clear();
                this.byType.clear();
            }
            
            procesos.forEach(proceso => {
                this.cacheProcesoIndividual(proceso);
            });
            
            this.rebuildIndexes();
        },
        
        // Cachear un proceso individual
        cacheProcesoIndividual(proceso) {
            this.items.set(proceso.id, proceso);
            
            // Actualizar índice por tipo
            const typeSet = this.byType.get(proceso.tipo) || new Set();
            typeSet.add(proceso.id);
            this.byType.set(proceso.tipo, typeSet);
        },
        
        // Actualizar proceso en cache
        updateProcesoInCache(id, updatedData) {
            const existing = this.items.get(id);
            if (existing) {
                const updated = this.formatProcesoData(updatedData);
                this.cacheProcesoIndividual(updated);
                
                // Actualizar detalles si existen
                if (updatedData.detalles) {
                    const detailsFormatted = this.formatProcesoDetails(updatedData);
                    this.details.set(id, {
                        ...detailsFormatted,
                        lastFetch: Date.now()
                    });
                }
                
                this.rebuildIndexes();
            }
        },
        
        // Reconstruir índices para búsqueda optimizada
        rebuildIndexes() {
            // Limpiar índices
            Object.values(this.indexes).forEach(index => index.clear());
            
            // Reconstruir índices
            for (const [id, proceso] of this.items) {
                // Índice por responsable
                if (proceso.responsable) {
                    const responsableSet = this.indexes.byResponsable.get(proceso.responsable.nombre) || new Set();
                    responsableSet.add(id);
                    this.indexes.byResponsable.set(proceso.responsable.nombre, responsableSet);
                }
                
                // Índice por estado
                const estadoSet = this.indexes.byEstado.get(proceso.estado) || new Set();
                estadoSet.add(id);
                this.indexes.byEstado.set(proceso.estado, estadoSet);
                
                // Índice por sede
                if (proceso.sede) {
                    const sedeSet = this.indexes.bySede.get(proceso.sede.nombre) || new Set();
                    sedeSet.add(id);
                    this.indexes.bySede.set(proceso.sede.nombre, sedeSet);
                }
                
                // Índice por fecha
                const dateKey = proceso.fecha.split('T')[0]; // YYYY-MM-DD
                const dateSet = this.indexes.byDate.get(dateKey) || new Set();
                dateSet.add(id);
                this.indexes.byDate.set(dateKey, dateSet);
            }
            
            // Reconstruir índice de órdenes desde detalles
            for (const [id, details] of this.details) {
                if (details.detalles) {
                    details.detalles.forEach(detalle => {
                        if (detalle.numOrden) {
                            const ordenSet = this.indexes.byOrden.get(detalle.numOrden) || new Set();
                            ordenSet.add(id);
                            this.indexes.byOrden.set(detalle.numOrden, ordenSet);
                        }
                    });
                }
            }
        }
    }
});
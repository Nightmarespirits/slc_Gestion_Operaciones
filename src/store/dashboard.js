import { defineStore } from 'pinia';
import axios from 'axios';
import { useOperacionesStore } from './operaciones';
import { useProcesosStore } from './procesos';

export const useDashboardStore = defineStore('dashboard', {
    state: () => ({
        // Cache con TTL para métricas calculadas
        metrics: {
            kpis: null,
            trends: null,
            processDistribution: null,
            employeeMetrics: null,
            machineStatus: null,
            bottlenecks: null,
            alerts: null
        },
        
        // Timestamps de cache para cada métrica
        cacheTimestamps: {
            kpis: null,
            trends: null,
            processDistribution: null,
            employeeMetrics: null,
            machineStatus: null,
            bottlenecks: null,
            alerts: null
        },
        
        // TTL configurables por tipo de métrica
        cacheTTL: {
            kpis: 2 * 60 * 1000,           // 2 minutos para KPIs
            trends: 5 * 60 * 1000,         // 5 minutos para tendencias
            processDistribution: 3 * 60 * 1000, // 3 minutos para distribución
            employeeMetrics: 10 * 60 * 1000,    // 10 minutos para métricas de empleados
            machineStatus: 1 * 60 * 1000,       // 1 minuto para estado de máquinas
            bottlenecks: 2 * 60 * 1000,         // 2 minutos para cuellos de botella
            alerts: 30 * 1000                   // 30 segundos para alertas
        },
        
        // Sistema de auto-refresh configurable
        autoRefresh: {
            enabled: true,
            intervals: new Map(), // Map<metricType, intervalId>
            defaultInterval: 60 * 1000, // 1 minuto por defecto
            customIntervals: {
                kpis: 30 * 1000,      // 30 segundos para KPIs
                alerts: 15 * 1000,    // 15 segundos para alertas
                machineStatus: 20 * 1000 // 20 segundos para máquinas
            }
        },
        
        // Estados de loading granulares
        loading: {
            kpis: false,
            trends: false,
            processDistribution: false,
            employeeMetrics: false,
            machineStatus: false,
            bottlenecks: false,
            alerts: false,
            initialLoad: false
        },
        
        // Configuración de filtros temporales
        timeFilters: {
            current: 'today', // today, week, month, custom
            customRange: {
                start: null,
                end: null
            },
            availableRanges: [
                { key: 'today', label: 'Hoy', days: 1 },
                { key: 'week', label: 'Esta Semana', days: 7 },
                { key: 'month', label: 'Este Mes', days: 30 },
                { key: 'quarter', label: 'Este Trimestre', days: 90 }
            ]
        },
        
        // Agregaciones optimizadas para KPIs en tiempo real
        aggregations: {
            operacionesHoy: 0,
            operacionesCompletadasHoy: 0,
            tiempoPromedioHoy: 0,
            eficienciaGeneral: 0,
            procesosMasLentos: [],
            empleadosMasProductivos: [],
            alertasActivas: 0
        },
        
        // Cache de datos históricos para gráficos
        historicalData: {
            operacionesPorDia: new Map(), // Map<date, count>
            tiemposPorProceso: new Map(), // Map<proceso, avgTime>
            productividadEmpleados: new Map(), // Map<empleado, metrics>
            lastUpdate: null
        },
        
        // Configuración de alertas
        alertConfig: {
            tiempoMaximoProceso: 4 * 60 * 60 * 1000, // 4 horas
            eficienciaMinima: 70, // 70%
            capacidadMaximaMaquina: 90, // 90%
            retrasoMaximo: 2 * 60 * 60 * 1000 // 2 horas
        }
    }),

    getters: {
        // Verificar si una métrica está en cache y es válida
        isCacheValid: (state) => (metricType) => {
            const timestamp = state.cacheTimestamps[metricType];
            if (!timestamp) return false;
            
            const now = Date.now();
            const ttl = state.cacheTTL[metricType];
            return (now - timestamp) < ttl;
        },
        
        // Obtener KPIs principales
        mainKPIs: (state) => {
            if (!state.metrics.kpis) return null;
            
            return {
                operacionesActivas: state.metrics.kpis.operacionesActivas || 0,
                completadasHoy: state.metrics.kpis.completadasHoy || 0,
                tiempoPromedio: state.metrics.kpis.tiempoPromedio || 0,
                eficienciaGeneral: state.metrics.kpis.eficienciaGeneral || 0,
                tendencias: state.metrics.kpis.tendencias || {}
            };
        },
        
        // Obtener datos de tendencias para gráficos
        trendData: (state) => {
            return state.metrics.trends || {
                operacionesPorDia: [],
                tiemposPorProceso: [],
                productividadEmpleados: []
            };
        },
        
        // Obtener distribución de procesos
        processDistribution: (state) => {
            return state.metrics.processDistribution || [];
        },
        
        // Obtener métricas de empleados
        employeeMetrics: (state) => {
            return state.metrics.employeeMetrics || [];
        },
        
        // Obtener estado de máquinas
        machineStatus: (state) => {
            return state.metrics.machineStatus || [];
        },
        
        // Obtener cuellos de botella identificados
        bottlenecks: (state) => {
            return state.metrics.bottlenecks || [];
        },
        
        // Obtener alertas activas
        activeAlerts: (state) => {
            return state.metrics.alerts || [];
        },
        
        // Obtener rango de fechas actual
        currentDateRange: (state) => {
            const filter = state.timeFilters.current;
            const now = new Date();
            
            if (filter === 'custom') {
                return {
                    start: state.timeFilters.customRange.start,
                    end: state.timeFilters.customRange.end
                };
            }
            
            const range = state.timeFilters.availableRanges.find(r => r.key === filter);
            if (!range) return { start: now, end: now };
            
            const start = new Date(now);
            start.setDate(start.getDate() - range.days + 1);
            start.setHours(0, 0, 0, 0);
            
            const end = new Date(now);
            end.setHours(23, 59, 59, 999);
            
            return { start, end };
        },
        
        // Verificar si hay alertas críticas
        hasCriticalAlerts: (state) => {
            const alerts = state.metrics.alerts || [];
            return alerts.some(alert => alert.severity === 'critical');
        },
        
        // Obtener resumen de estado general
        systemStatus: (state) => {
            const kpis = state.metrics.kpis;
            if (!kpis) return 'loading';
            
            const eficiencia = kpis.eficienciaGeneral || 0;
            const alertas = state.metrics.alerts?.length || 0;
            
            if (alertas > 5 || eficiencia < 60) return 'critical';
            if (alertas > 2 || eficiencia < 80) return 'warning';
            return 'good';
        }
    },

    actions: {
        // Inicializar dashboard con carga inicial de todas las métricas
        async initializeDashboard() {
            this.loading.initialLoad = true;
            
            try {
                // Cargar métricas principales en paralelo
                await Promise.allSettled([
                    this.fetchKPIs(),
                    this.fetchProcessDistribution(),
                    this.fetchAlerts()
                ]);
                
                // Configurar auto-refresh
                this.setupAutoRefresh();
                
            } catch (error) {
                console.error('Error initializing dashboard:', error);
            } finally {
                this.loading.initialLoad = false;
            }
        },
        
        // Cargar KPIs principales
        async fetchKPIs(forceRefresh = false) {
            if (!forceRefresh && this.isCacheValid('kpis')) {
                return this.metrics.kpis;
            }
            
            this.loading.kpis = true;
            
            try {
                // Intentar endpoint optimizado primero
                let response;
                try {
                    response = await axios.get(
                        `${import.meta.env.VITE_API_URL}/dashboard/kpis`,
                        { params: this.getDateRangeParams() }
                    );
                } catch (error) {
                    if (error.response?.status === 404) {
                        // Fallback: calcular KPIs desde stores existentes
                        response = { data: await this.calculateKPIsFromStores() };
                    } else {
                        throw error;
                    }
                }
                
                this.metrics.kpis = this.formatKPIs(response.data);
                this.cacheTimestamps.kpis = Date.now();
                
                return this.metrics.kpis;
                
            } catch (error) {
                console.error('Error fetching KPIs:', error);
                throw error;
            } finally {
                this.loading.kpis = false;
            }
        },
        
        // Cargar datos de tendencias
        async fetchTrends(forceRefresh = false) {
            if (!forceRefresh && this.isCacheValid('trends')) {
                return this.metrics.trends;
            }
            
            this.loading.trends = true;
            
            try {
                let response;
                try {
                    response = await axios.get(
                        `${import.meta.env.VITE_API_URL}/dashboard/trends`,
                        { params: this.getDateRangeParams() }
                    );
                } catch (error) {
                    if (error.response?.status === 404) {
                        response = { data: await this.calculateTrendsFromStores() };
                    } else {
                        throw error;
                    }
                }
                
                this.metrics.trends = this.formatTrends(response.data);
                this.cacheTimestamps.trends = Date.now();
                
                return this.metrics.trends;
                
            } catch (error) {
                console.error('Error fetching trends:', error);
                throw error;
            } finally {
                this.loading.trends = false;
            }
        },
        
        // Cargar distribución de procesos
        async fetchProcessDistribution(forceRefresh = false) {
            if (!forceRefresh && this.isCacheValid('processDistribution')) {
                return this.metrics.processDistribution;
            }
            
            this.loading.processDistribution = true;
            
            try {
                let response;
                try {
                    response = await axios.get(
                        `${import.meta.env.VITE_API_URL}/dashboard/process-distribution`,
                        { params: this.getDateRangeParams() }
                    );
                } catch (error) {
                    if (error.response?.status === 404) {
                        response = { data: await this.calculateProcessDistributionFromStores() };
                    } else {
                        throw error;
                    }
                }
                
                this.metrics.processDistribution = response.data;
                this.cacheTimestamps.processDistribution = Date.now();
                
                return this.metrics.processDistribution;
                
            } catch (error) {
                console.error('Error fetching process distribution:', error);
                throw error;
            } finally {
                this.loading.processDistribution = false;
            }
        },
        
        // Cargar métricas de empleados
        async fetchEmployeeMetrics(forceRefresh = false) {
            if (!forceRefresh && this.isCacheValid('employeeMetrics')) {
                return this.metrics.employeeMetrics;
            }
            
            this.loading.employeeMetrics = true;
            
            try {
                let response;
                try {
                    response = await axios.get(
                        `${import.meta.env.VITE_API_URL}/dashboard/employee-metrics`,
                        { params: this.getDateRangeParams() }
                    );
                } catch (error) {
                    if (error.response?.status === 404) {
                        response = { data: await this.calculateEmployeeMetricsFromStores() };
                    } else {
                        throw error;
                    }
                }
                
                this.metrics.employeeMetrics = response.data;
                this.cacheTimestamps.employeeMetrics = Date.now();
                
                return this.metrics.employeeMetrics;
                
            } catch (error) {
                console.error('Error fetching employee metrics:', error);
                throw error;
            } finally {
                this.loading.employeeMetrics = false;
            }
        },
        
        // Cargar estado de máquinas
        async fetchMachineStatus(forceRefresh = false) {
            if (!forceRefresh && this.isCacheValid('machineStatus')) {
                return this.metrics.machineStatus;
            }
            
            this.loading.machineStatus = true;
            
            try {
                // Simular datos de máquinas por ahora
                const mockMachineData = this.generateMockMachineStatus();
                
                this.metrics.machineStatus = mockMachineData;
                this.cacheTimestamps.machineStatus = Date.now();
                
                return this.metrics.machineStatus;
                
            } catch (error) {
                console.error('Error fetching machine status:', error);
                throw error;
            } finally {
                this.loading.machineStatus = false;
            }
        },
        
        // Cargar cuellos de botella
        async fetchBottlenecks(forceRefresh = false) {
            if (!forceRefresh && this.isCacheValid('bottlenecks')) {
                return this.metrics.bottlenecks;
            }
            
            this.loading.bottlenecks = true;
            
            try {
                const bottlenecks = await this.detectBottlenecks();
                
                this.metrics.bottlenecks = bottlenecks;
                this.cacheTimestamps.bottlenecks = Date.now();
                
                return this.metrics.bottlenecks;
                
            } catch (error) {
                console.error('Error fetching bottlenecks:', error);
                throw error;
            } finally {
                this.loading.bottlenecks = false;
            }
        },
        
        // Cargar alertas
        async fetchAlerts(forceRefresh = false) {
            if (!forceRefresh && this.isCacheValid('alerts')) {
                return this.metrics.alerts;
            }
            
            this.loading.alerts = true;
            
            try {
                const alerts = await this.generateAlerts();
                
                this.metrics.alerts = alerts;
                this.cacheTimestamps.alerts = Date.now();
                
                return this.metrics.alerts;
                
            } catch (error) {
                console.error('Error fetching alerts:', error);
                throw error;
            } finally {
                this.loading.alerts = false;
            }
        },
        
        // Configurar auto-refresh para métricas
        setupAutoRefresh() {
            if (!this.autoRefresh.enabled) return;
            
            // Limpiar intervalos existentes
            this.clearAutoRefresh();
            
            // Configurar intervalos para cada métrica
            const metricsToRefresh = ['kpis', 'alerts', 'machineStatus'];
            
            metricsToRefresh.forEach(metric => {
                const interval = this.autoRefresh.customIntervals[metric] || this.autoRefresh.defaultInterval;
                
                const intervalId = setInterval(() => {
                    this[`fetch${metric.charAt(0).toUpperCase() + metric.slice(1)}`](true);
                }, interval);
                
                this.autoRefresh.intervals.set(metric, intervalId);
            });
        },
        
        // Limpiar auto-refresh
        clearAutoRefresh() {
            this.autoRefresh.intervals.forEach(intervalId => {
                clearInterval(intervalId);
            });
            this.autoRefresh.intervals.clear();
        },
        
        // Cambiar filtro temporal
        setTimeFilter(filter, customRange = null) {
            this.timeFilters.current = filter;
            
            if (filter === 'custom' && customRange) {
                this.timeFilters.customRange = customRange;
            }
            
            // Invalidar cache de métricas dependientes del tiempo
            ['kpis', 'trends', 'processDistribution', 'employeeMetrics'].forEach(metric => {
                this.cacheTimestamps[metric] = null;
            });
            
            // Recargar métricas principales
            return Promise.allSettled([
                this.fetchKPIs(true),
                this.fetchTrends(true),
                this.fetchProcessDistribution(true)
            ]);
        },
        
        // Refrescar todas las métricas
        async refreshAllMetrics() {
            this.loading.initialLoad = true;
            
            try {
                await Promise.allSettled([
                    this.fetchKPIs(true),
                    this.fetchTrends(true),
                    this.fetchProcessDistribution(true),
                    this.fetchEmployeeMetrics(true),
                    this.fetchMachineStatus(true),
                    this.fetchBottlenecks(true),
                    this.fetchAlerts(true)
                ]);
            } finally {
                this.loading.initialLoad = false;
            }
        },
        
        // Calcular KPIs desde stores existentes (fallback)
        async calculateKPIsFromStores() {
            const operacionesStore = useOperacionesStore();
            const procesosStore = useProcesosStore();
            
            // Asegurar que tenemos datos
            if (operacionesStore.items.size === 0) {
                await operacionesStore.fetchOperaciones();
            }
            
            const stats = operacionesStore.stats;
            const today = new Date().toISOString().split('T')[0];
            
            // Calcular operaciones de hoy
            const operacionesHoy = Array.from(operacionesStore.items.values())
                .filter(op => op.fechas.fecCreacion.startsWith(today));
            
            const completadasHoy = operacionesHoy.filter(op => op.estadoOperacion).length;
            
            // Calcular tiempo promedio (simulado)
            const tiempoPromedio = 3.5; // horas promedio
            
            return {
                operacionesActivas: stats.pendientes,
                completadasHoy,
                tiempoPromedio,
                eficienciaGeneral: stats.porcentajeCompletado,
                tendencias: {
                    operacionesActivas: { change: 5, trend: 'up' },
                    completadasHoy: { change: 12, trend: 'up' },
                    tiempoPromedio: { change: -8, trend: 'down' },
                    eficienciaGeneral: { change: 3, trend: 'up' }
                }
            };
        },
        
        // Calcular tendencias desde stores (fallback)
        async calculateTrendsFromStores() {
            // Implementación simplificada para fallback
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                return {
                    date: date.toISOString().split('T')[0],
                    operaciones: Math.floor(Math.random() * 20) + 10,
                    completadas: Math.floor(Math.random() * 15) + 5
                };
            }).reverse();
            
            return {
                operacionesPorDia: last7Days,
                tiemposPorProceso: [
                    { proceso: 'lavado', tiempo: 2.5 },
                    { proceso: 'secado', tiempo: 3.0 },
                    { proceso: 'doblado', tiempo: 1.5 },
                    { proceso: 'planchado', tiempo: 2.0 },
                    { proceso: 'tenido', tiempo: 4.0 }
                ],
                productividadEmpleados: []
            };
        },
        
        // Calcular distribución de procesos desde stores (fallback)
        async calculateProcessDistributionFromStores() {
            const procesosStore = useProcesosStore();
            const stats = procesosStore.statsByType;
            
            return Array.from(stats.entries()).map(([tipo, data]) => ({
                tipo,
                total: data.total,
                completados: data.completados,
                pendientes: data.pendientes,
                porcentaje: data.porcentajeCompletado
            }));
        },
        
        // Calcular métricas de empleados desde stores (fallback)
        async calculateEmployeeMetricsFromStores() {
            // Implementación simplificada
            return [
                { nombre: 'Juan Pérez', operaciones: 15, eficiencia: 92 },
                { nombre: 'María García', operaciones: 12, eficiencia: 88 },
                { nombre: 'Carlos López', operaciones: 18, eficiencia: 85 }
            ];
        },
        
        // Generar datos mock de máquinas
        generateMockMachineStatus() {
            const machines = [
                { id: 'LAV001', tipo: 'lavado', estado: 'operativa', utilizacion: 85 },
                { id: 'LAV002', tipo: 'lavado', estado: 'operativa', utilizacion: 72 },
                { id: 'SEC001', tipo: 'secado', estado: 'mantenimiento', utilizacion: 0 },
                { id: 'SEC002', tipo: 'secado', estado: 'operativa', utilizacion: 95 },
                { id: 'PLAN001', tipo: 'planchado', estado: 'operativa', utilizacion: 68 }
            ];
            
            return machines;
        },
        
        // Detectar cuellos de botella
        async detectBottlenecks() {
            const procesosStore = useProcesosStore();
            const bottlenecks = [];
            
            // Analizar procesos con baja eficiencia
            const stats = procesosStore.statsByType;
            
            for (const [tipo, data] of stats) {
                if (data.porcentajeCompletado < 70 && data.total > 5) {
                    bottlenecks.push({
                        tipo: 'proceso_lento',
                        proceso: tipo,
                        descripcion: `El proceso de ${tipo} tiene baja eficiencia (${data.porcentajeCompletado}%)`,
                        severidad: 'warning',
                        sugerencia: `Revisar asignación de recursos para ${tipo}`
                    });
                }
            }
            
            return bottlenecks;
        },
        
        // Generar alertas basadas en configuración
        async generateAlerts() {
            const alerts = [];
            const now = Date.now();
            
            // Simular algunas alertas
            if (Math.random() > 0.7) {
                alerts.push({
                    id: `alert_${now}`,
                    tipo: 'retraso',
                    titulo: 'Operación retrasada',
                    descripcion: 'La operación #12345 lleva más de 4 horas en proceso',
                    severidad: 'warning',
                    timestamp: now,
                    operacionId: '12345'
                });
            }
            
            if (Math.random() > 0.8) {
                alerts.push({
                    id: `alert_${now + 1}`,
                    tipo: 'maquina',
                    titulo: 'Máquina con alta utilización',
                    descripcion: 'La máquina SEC002 está al 95% de capacidad',
                    severidad: 'critical',
                    timestamp: now,
                    maquinaId: 'SEC002'
                });
            }
            
            return alerts;
        },
        
        // Formatear KPIs
        formatKPIs(data) {
            return {
                operacionesActivas: data.operacionesActivas || 0,
                completadasHoy: data.completadasHoy || 0,
                tiempoPromedio: data.tiempoPromedio || 0,
                eficienciaGeneral: data.eficienciaGeneral || 0,
                tendencias: data.tendencias || {}
            };
        },
        
        // Formatear tendencias
        formatTrends(data) {
            return {
                operacionesPorDia: data.operacionesPorDia || [],
                tiemposPorProceso: data.tiemposPorProceso || [],
                productividadEmpleados: data.productividadEmpleados || []
            };
        },
        
        // Obtener parámetros de rango de fechas
        getDateRangeParams() {
            const range = this.currentDateRange;
            return {
                startDate: range.start?.toISOString(),
                endDate: range.end?.toISOString()
            };
        },
        
        // Limpiar cache
        clearCache() {
            Object.keys(this.metrics).forEach(key => {
                this.metrics[key] = null;
                this.cacheTimestamps[key] = null;
            });
        },
        
        // Destruir store (cleanup)
        destroy() {
            this.clearAutoRefresh();
            this.clearCache();
        }
    }
});
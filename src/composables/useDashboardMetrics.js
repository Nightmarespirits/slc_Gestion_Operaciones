import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useDashboardStore } from '../store/dashboard';

export function useDashboardMetrics(options = {}) {
    const {
        autoRefresh = true,
        refreshInterval = 30000,
        enableRealTimeUpdates = true
    } = options;

    const dashboardStore = useDashboardStore();
    
    // Estado local
    const isRefreshing = ref(false);
    const lastRefresh = ref(null);
    const refreshTimer = ref(null);
    const errors = ref(new Map());

    // Computed properties
    const kpis = computed(() => dashboardStore.mainKPIs);
    const trends = computed(() => dashboardStore.trendData);
    const processDistribution = computed(() => dashboardStore.processDistribution);
    const employeeMetrics = computed(() => dashboardStore.employeeMetrics);
    const machineStatus = computed(() => dashboardStore.machineStatus);
    const bottlenecks = computed(() => dashboardStore.bottlenecks);
    const alerts = computed(() => dashboardStore.activeAlerts);
    const systemStatus = computed(() => dashboardStore.systemStatus);
    
    const loading = computed(() => ({
        kpis: dashboardStore.loading.kpis,
        trends: dashboardStore.loading.trends,
        processDistribution: dashboardStore.loading.processDistribution,
        employeeMetrics: dashboardStore.loading.employeeMetrics,
        machineStatus: dashboardStore.loading.machineStatus,
        bottlenecks: dashboardStore.loading.bottlenecks,
        alerts: dashboardStore.loading.alerts,
        initial: dashboardStore.loading.initialLoad
    }));

    const hasErrors = computed(() => errors.value.size > 0);
    const criticalAlerts = computed(() => 
        alerts.value.filter(alert => alert.severidad === 'critical')
    );

    // Métodos principales
    async function initializeDashboard() {
        try {
            await dashboardStore.initializeDashboard();
            lastRefresh.value = new Date();
            errors.value.clear();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            errors.value.set('initialization', error);
        }
    }

    async function refreshMetric(metricType, forceRefresh = false) {
        if (isRefreshing.value) return;

        const methodMap = {
            kpis: 'fetchKPIs',
            trends: 'fetchTrends',
            processDistribution: 'fetchProcessDistribution',
            employeeMetrics: 'fetchEmployeeMetrics',
            machineStatus: 'fetchMachineStatus',
            bottlenecks: 'fetchBottlenecks',
            alerts: 'fetchAlerts'
        };

        const method = methodMap[metricType];
        if (!method) {
            console.warn(`Unknown metric type: ${metricType}`);
            return;
        }

        try {
            errors.value.delete(metricType);
            await dashboardStore[method](forceRefresh);
            lastRefresh.value = new Date();
        } catch (error) {
            console.error(`Error refreshing ${metricType}:`, error);
            errors.value.set(metricType, error);
            throw error;
        }
    }

    async function refreshAllMetrics(forceRefresh = false) {
        if (isRefreshing.value) return;

        isRefreshing.value = true;
        try {
            await dashboardStore.refreshAllMetrics();
            lastRefresh.value = new Date();
            errors.value.clear();
        } catch (error) {
            console.error('Error refreshing all metrics:', error);
            errors.value.set('refresh_all', error);
        } finally {
            isRefreshing.value = false;
        }
    }

    function setupAutoRefresh() {
        if (!autoRefresh || refreshTimer.value) return;

        refreshTimer.value = setInterval(async () => {
            try {
                // Refrescar métricas críticas más frecuentemente
                await Promise.allSettled([
                    refreshMetric('kpis', true),
                    refreshMetric('alerts', true),
                    refreshMetric('machineStatus', true)
                ]);
            } catch (error) {
                console.error('Auto-refresh error:', error);
            }
        }, refreshInterval);
    }

    function clearAutoRefresh() {
        if (refreshTimer.value) {
            clearInterval(refreshTimer.value);
            refreshTimer.value = null;
        }
    }

    async function setTimeFilter(filter, customRange = null) {
        try {
            await dashboardStore.setTimeFilter(filter, customRange);
            lastRefresh.value = new Date();
        } catch (error) {
            console.error('Error setting time filter:', error);
            errors.value.set('time_filter', error);
        }
    }

    // Métodos de utilidad
    function getMetricTrend(currentValue, previousValue) {
        if (!previousValue || previousValue === 0) return null;
        
        const change = ((currentValue - previousValue) / previousValue) * 100;
        const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
        
        return {
            change: Math.abs(change).toFixed(1),
            trend,
            isPositive: change > 0,
            isNegative: change < 0
        };
    }

    function formatMetricValue(value, type = 'number') {
        if (value === null || value === undefined) return '-';
        
        switch (type) {
            case 'number':
                return new Intl.NumberFormat('es-ES').format(value);
            case 'percentage':
                return `${value.toFixed(1)}%`;
            case 'currency':
                return new Intl.NumberFormat('es-ES', {
                    style: 'currency',
                    currency: 'COP'
                }).format(value);
            case 'time':
                if (value < 1) {
                    return `${Math.round(value * 60)}min`;
                }
                return `${value.toFixed(1)}h`;
            case 'duration':
                const hours = Math.floor(value / 3600000);
                const minutes = Math.floor((value % 3600000) / 60000);
                return `${hours}h ${minutes}m`;
            default:
                return value.toString();
        }
    }

    function getStatusColor(status) {
        const colorMap = {
            good: 'success',
            warning: 'warning',
            critical: 'error',
            loading: 'grey'
        };
        return colorMap[status] || 'grey';
    }

    function getAlertSeverityColor(severity) {
        const colorMap = {
            info: 'info',
            warning: 'warning',
            critical: 'error',
            success: 'success'
        };
        return colorMap[severity] || 'grey';
    }

    // Métodos de análisis
    function analyzeBottlenecks() {
        const processes = processDistribution.value || [];
        const bottleneckThreshold = 70; // Porcentaje mínimo de eficiencia
        
        return processes
            .filter(process => process.porcentaje < bottleneckThreshold)
            .map(process => ({
                tipo: process.tipo,
                eficiencia: process.porcentaje,
                impacto: 'high',
                recomendacion: `Revisar asignación de recursos para ${process.tipo}`
            }));
    }

    function getPerformanceInsights() {
        const kpiData = kpis.value;
        if (!kpiData) return [];

        const insights = [];

        // Análisis de eficiencia
        if (kpiData.eficienciaGeneral < 70) {
            insights.push({
                type: 'warning',
                title: 'Eficiencia Baja',
                description: 'La eficiencia general está por debajo del 70%',
                action: 'Revisar procesos con mayor tiempo de ejecución'
            });
        }

        // Análisis de operaciones activas
        if (kpiData.operacionesActivas > 50) {
            insights.push({
                type: 'info',
                title: 'Alta Carga de Trabajo',
                description: 'Hay muchas operaciones activas simultáneamente',
                action: 'Considerar redistribuir la carga de trabajo'
            });
        }

        // Análisis de tiempo promedio
        if (kpiData.tiempoPromedio > 4) {
            insights.push({
                type: 'warning',
                title: 'Tiempo Promedio Alto',
                description: 'Las operaciones están tomando más tiempo del esperado',
                action: 'Identificar cuellos de botella en los procesos'
            });
        }

        return insights;
    }

    // Lifecycle
    onMounted(() => {
        initializeDashboard();
        setupAutoRefresh();
    });

    onUnmounted(() => {
        clearAutoRefresh();
        dashboardStore.destroy();
    });

    return {
        // Estado
        isRefreshing,
        lastRefresh,
        errors,
        hasErrors,
        
        // Datos computados
        kpis,
        trends,
        processDistribution,
        employeeMetrics,
        machineStatus,
        bottlenecks,
        alerts,
        criticalAlerts,
        systemStatus,
        loading,
        
        // Métodos principales
        initializeDashboard,
        refreshMetric,
        refreshAllMetrics,
        setTimeFilter,
        
        // Control de auto-refresh
        setupAutoRefresh,
        clearAutoRefresh,
        
        // Utilidades
        getMetricTrend,
        formatMetricValue,
        getStatusColor,
        getAlertSeverityColor,
        
        // Análisis
        analyzeBottlenecks,
        getPerformanceInsights
    };
}

// Composable específico para KPIs
export function useKPIMetrics(options = {}) {
    const dashboardMetrics = useDashboardMetrics(options);
    
    const kpiCards = computed(() => {
        const kpiData = dashboardMetrics.kpis.value;
        if (!kpiData) return [];
        
        return [
            {
                key: 'operacionesActivas',
                title: 'Operaciones Activas',
                value: kpiData.operacionesActivas,
                format: 'number',
                icon: 'mdi-cog-play',
                color: 'primary',
                trend: kpiData.tendencias?.operacionesActivas
            },
            {
                key: 'completadasHoy',
                title: 'Completadas Hoy',
                value: kpiData.completadasHoy,
                format: 'number',
                icon: 'mdi-check-circle',
                color: 'success',
                trend: kpiData.tendencias?.completadasHoy
            },
            {
                key: 'tiempoPromedio',
                title: 'Tiempo Promedio',
                value: kpiData.tiempoPromedio,
                format: 'time',
                icon: 'mdi-clock-outline',
                color: 'info',
                trend: kpiData.tendencias?.tiempoPromedio
            },
            {
                key: 'eficienciaGeneral',
                title: 'Eficiencia General',
                value: kpiData.eficienciaGeneral,
                format: 'percentage',
                icon: 'mdi-speedometer',
                color: getEfficiencyColor(kpiData.eficienciaGeneral),
                trend: kpiData.tendencias?.eficienciaGeneral
            }
        ];
    });
    
    function getEfficiencyColor(efficiency) {
        if (efficiency >= 90) return 'success';
        if (efficiency >= 75) return 'warning';
        if (efficiency >= 60) return 'orange';
        return 'error';
    }
    
    return {
        ...dashboardMetrics,
        kpiCards
    };
}
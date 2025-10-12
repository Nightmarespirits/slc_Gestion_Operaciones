import axios from 'axios';

/**
 * Service for managing proceso-related API calls with error handling and retry logic
 */
class ProcesoService {
    constructor() {
        this.baseURL = import.meta.env.VITE_API_URL;
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second base delay
        
        // Create axios instance that uses the global defaults (including auth headers)
        this.api = axios.create({
            baseURL: this.baseURL
        });
        
        // Use interceptor to ensure auth headers are always included
        this.api.interceptors.request.use(
            (config) => {
                // Merge with global axios defaults to include auth headers
                config.headers = {
                    ...axios.defaults.headers.common,
                    ...config.headers
                };
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );
    }

    /**
     * Sleep utility for retry delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Calculate exponential backoff delay
     */
    getRetryDelay(attempt) {
        return this.retryDelay * Math.pow(2, attempt);
    }

    /**
     * Generic retry wrapper for API calls
     */
    async withRetry(apiCall, maxRetries = this.maxRetries) {
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await apiCall();
            } catch (error) {
                lastError = error;
                
                // Don't retry on client errors (4xx) except for 408, 429
                if (error.response?.status >= 400 && error.response?.status < 500) {
                    if (error.response.status !== 408 && error.response.status !== 429) {
                        throw error;
                    }
                }
                
                // Don't retry on the last attempt
                if (attempt === maxRetries) {
                    break;
                }
                
                // Wait before retrying with exponential backoff
                const delay = this.getRetryDelay(attempt);
                console.warn(`API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`, error.message);
                await this.sleep(delay);
            }
        }
        
        throw lastError;
    }

    /**
     * Update individual detail status with optimistic update pattern
     * @param {string} procesoId - Process ID
     * @param {string} detalleId - Detail ID  
     * @param {boolean} estado - New status (true/false)
     * @returns {Promise<Object>} Updated process data
     */
    async updateDetailStatus(procesoId, detalleId, estado) {
        const apiCall = () => this.api.patch(
            `/procesos/${procesoId}/detalles/${detalleId}/estado`,
            { estado },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        try {
            const response = await this.withRetry(apiCall);
            return {
                success: true,
                data: response.data,
                message: response.data.message || 'Estado actualizado correctamente'
            };
        } catch (error) {
            console.error('Error updating detail status:', error);
            
            let errorMessage = 'Error al actualizar el estado del detalle';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            return {
                success: false,
                error: errorMessage,
                originalError: error
            };
        }
    }

    /**
     * Batch update multiple detail statuses
     * @param {string} procesoId - Process ID
     * @param {Array} updates - Array of {detalleId, estado} objects
     * @returns {Promise<Object>} Updated process data
     */
    async batchUpdateDetailStatus(procesoId, updates) {
        const apiCall = () => this.api.patch(
            `/procesos/${procesoId}/detalles/batch-status`,
            { updates },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        try {
            const response = await this.withRetry(apiCall);
            return {
                success: true,
                data: response.data,
                message: response.data.message || 'Estados actualizados correctamente'
            };
        } catch (error) {
            console.error('Error batch updating detail statuses:', error);
            
            let errorMessage = 'Error al actualizar los estados de los detalles';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            return {
                success: false,
                error: errorMessage,
                originalError: error
            };
        }
    }

    /**
     * Get process with calculated status
     * @param {string} procesoId - Process ID
     * @returns {Promise<Object>} Process data with calculated status
     */
    async getProcesoWithStatus(procesoId) {
        const apiCall = () => this.api.get(`/procesos/${procesoId}`);

        try {
            const response = await this.withRetry(apiCall);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching process:', error);
            
            let errorMessage = 'Error al cargar el proceso';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            return {
                success: false,
                error: errorMessage,
                originalError: error
            };
        }
    }

    /**
     * Get filtered processes with calculated statuses
     * @param {Object} filters - Filter parameters
     * @returns {Promise<Object>} Filtered processes data
     */
    async getFilteredProcesos(filters = {}) {
        const apiCall = () => this.api.get(`/procesos/filter`, {
            params: filters
        });

        try {
            const response = await this.withRetry(apiCall);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching filtered processes:', error);
            
            let errorMessage = 'Error al cargar los procesos';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            return {
                success: false,
                error: errorMessage,
                originalError: error
            };
        }
    }
}

// Export singleton instance
export default new ProcesoService();
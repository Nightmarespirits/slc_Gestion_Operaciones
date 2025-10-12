import { ref, reactive, readonly } from 'vue';
import procesoService from '@/services/procesoService';

/**
 * Composable for managing optimistic updates with rollback capability
 */
export function useOptimisticUpdates() {
    const pendingUpdates = reactive(new Map());
    const updateErrors = ref(new Map());

    /**
     * Perform optimistic update for detail status
     * @param {Object} detail - Detail object to update
     * @param {boolean} newStatus - New status value
     * @param {string} procesoId - Process ID
     * @param {Function} onSuccess - Success callback
     * @param {Function} onError - Error callback
     */
    const updateDetailStatusOptimistic = async (detail, newStatus, procesoId, onSuccess, onError) => {
        const updateKey = `${procesoId}-${detail._id}`;
        const originalStatus = detail.estado;

        // Clear any previous errors for this detail
        updateErrors.value.delete(updateKey);

        // Mark as pending update
        pendingUpdates.set(updateKey, {
            originalStatus,
            newStatus,
            timestamp: Date.now()
        });

        // Optimistic UI update
        detail.estado = newStatus;
        detail.updating = true;

        try {
            const result = await procesoService.updateDetailStatus(procesoId, detail._id, newStatus);

            if (result.success) {
                // Update successful - remove from pending updates
                pendingUpdates.delete(updateKey);
                detail.updating = false;

                // Call success callback with updated data
                if (onSuccess) {
                    onSuccess(result.data, result.message);
                }

                return result;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            // Rollback optimistic update
            detail.estado = originalStatus;
            detail.updating = false;

            // Store error information
            updateErrors.value.set(updateKey, {
                error: error.message || 'Error al actualizar el estado',
                timestamp: Date.now(),
                retryCount: 0
            });

            // Remove from pending updates
            pendingUpdates.delete(updateKey);

            // Call error callback
            if (onError) {
                onError(error.message || 'Error al actualizar el estado');
            }

            throw error;
        }
    };

    /**
     * Retry a failed update
     * @param {Object} detail - Detail object to retry
     * @param {string} procesoId - Process ID
     * @param {Function} onSuccess - Success callback
     * @param {Function} onError - Error callback
     */
    const retryUpdate = async (detail, procesoId, onSuccess, onError) => {
        const updateKey = `${procesoId}-${detail._id}`;
        const errorInfo = updateErrors.value.get(updateKey);

        if (!errorInfo) {
            console.warn('No error information found for retry');
            return;
        }

        // Increment retry count
        errorInfo.retryCount = (errorInfo.retryCount || 0) + 1;

        // Clear the error temporarily
        updateErrors.value.delete(updateKey);

        try {
            // Determine the intended status (opposite of current since rollback occurred)
            const intendedStatus = !detail.estado;
            await updateDetailStatusOptimistic(detail, intendedStatus, procesoId, onSuccess, onError);
        } catch (error) {
            // Update retry count in error info
            const newErrorInfo = updateErrors.value.get(updateKey);
            if (newErrorInfo) {
                newErrorInfo.retryCount = errorInfo.retryCount;
            }
        }
    };

    /**
     * Batch update multiple details with optimistic updates
     * @param {Array} updates - Array of {detail, newStatus} objects
     * @param {string} procesoId - Process ID
     * @param {Function} onSuccess - Success callback
     * @param {Function} onError - Error callback
     */
    const batchUpdateDetailsOptimistic = async (updates, procesoId, onSuccess, onError) => {
        const batchKey = `batch-${procesoId}-${Date.now()}`;
        const originalStatuses = new Map();

        // Store original statuses and apply optimistic updates
        updates.forEach(({ detail, newStatus }) => {
            const detailKey = `${procesoId}-${detail._id}`;
            originalStatuses.set(detailKey, detail.estado);

            detail.estado = newStatus;
            detail.updating = true;

            pendingUpdates.set(detailKey, {
                originalStatus: detail.estado,
                newStatus,
                timestamp: Date.now(),
                batchKey
            });
        });

        try {
            const batchUpdates = updates.map(({ detail, newStatus }) => ({
                detalleId: detail._id,
                estado: newStatus
            }));

            const result = await procesoService.batchUpdateDetailStatus(procesoId, batchUpdates);

            if (result.success) {
                // Clear pending updates and updating flags
                updates.forEach(({ detail }) => {
                    const detailKey = `${procesoId}-${detail._id}`;
                    pendingUpdates.delete(detailKey);
                    detail.updating = false;
                });

                if (onSuccess) {
                    onSuccess(result.data, result.message);
                }

                return result;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            // Rollback all optimistic updates
            updates.forEach(({ detail }) => {
                const detailKey = `${procesoId}-${detail._id}`;
                const originalStatus = originalStatuses.get(detailKey);

                detail.estado = originalStatus;
                detail.updating = false;

                pendingUpdates.delete(detailKey);
                updateErrors.value.set(detailKey, {
                    error: error.message || 'Error en actualización por lotes',
                    timestamp: Date.now(),
                    retryCount: 0,
                    batchKey
                });
            });

            if (onError) {
                onError(error.message || 'Error en actualización por lotes');
            }

            throw error;
        }
    };

    /**
     * Check if a detail has a pending update
     * @param {string} procesoId - Process ID
     * @param {string} detalleId - Detail ID
     * @returns {boolean} True if update is pending
     */
    const hasPendingUpdate = (procesoId, detalleId) => {
        const updateKey = `${procesoId}-${detalleId}`;
        return pendingUpdates.has(updateKey);
    };

    /**
     * Check if a detail has an error
     * @param {string} procesoId - Process ID
     * @param {string} detalleId - Detail ID
     * @returns {Object|null} Error information or null
     */
    const getUpdateError = (procesoId, detalleId) => {
        const updateKey = `${procesoId}-${detalleId}`;
        return updateErrors.value.get(updateKey) || null;
    };

    /**
     * Clear error for a specific detail
     * @param {string} procesoId - Process ID
     * @param {string} detalleId - Detail ID
     */
    const clearUpdateError = (procesoId, detalleId) => {
        const updateKey = `${procesoId}-${detalleId}`;
        updateErrors.value.delete(updateKey);
    };

    /**
     * Clear all errors
     */
    const clearAllErrors = () => {
        updateErrors.value.clear();
    };

    /**
     * Get all pending updates count
     * @returns {number} Number of pending updates
     */
    const getPendingUpdatesCount = () => {
        return pendingUpdates.size;
    };

    return {
        // Methods
        updateDetailStatusOptimistic,
        retryUpdate,
        batchUpdateDetailsOptimistic,

        // State checkers
        hasPendingUpdate,
        getUpdateError,
        clearUpdateError,
        clearAllErrors,
        getPendingUpdatesCount,

        // Reactive state (read-only)
        pendingUpdates: readonly(pendingUpdates),
        updateErrors: readonly(updateErrors)
    };
}
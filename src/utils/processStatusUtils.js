/**
 * Utility functions for process status calculation and management
 */

/**
 * Calculate process status based on detail completion
 * @param {Array} detalles - Array of process details
 * @returns {Object} Status information
 */
export function calculateProcessStatus(detalles) {
    if (!detalles || detalles.length === 0) {
        return {
            estado: false,
            completedCount: 0,
            totalCount: 0,
            completionPercentage: 0,
            statusText: 'Sin detalles'
        };
    }

    const completedDetails = detalles.filter(detail => detail.estado === true);
    const completedCount = completedDetails.length;
    const totalCount = detalles.length;
    const completionPercentage = Math.round((completedCount / totalCount) * 100);

    const allCompleted = completedCount === totalCount;

    let statusText;
    if (allCompleted) {
        statusText = 'Finalizado';
    } else if (completedCount === 0) {
        statusText = 'Pendiente';
    } else {
        statusText = `En progreso (${completedCount}/${totalCount})`;
    }

    return {
        estado: allCompleted,
        completedCount,
        totalCount,
        completionPercentage,
        statusText,
        isPartiallyComplete: completedCount > 0 && !allCompleted
    };
}

/**
 * Get status color based on completion
 * @param {Object} statusInfo - Status information from calculateProcessStatus
 * @returns {string} Color class or hex color
 */
export function getStatusColor(statusInfo) {
    if (statusInfo.estado) {
        return 'success'; // Green for completed
    } else if (statusInfo.isPartiallyComplete) {
        return 'warning'; // Orange/yellow for in progress
    } else {
        return 'error'; // Red for pending
    }
}

/**
 * Get status icon based on completion
 * @param {Object} statusInfo - Status information from calculateProcessStatus
 * @returns {string} Icon name
 */
export function getStatusIcon(statusInfo) {
    if (statusInfo.estado) {
        return 'mdi-check-circle';
    } else if (statusInfo.isPartiallyComplete) {
        return 'mdi-clock-outline';
    } else {
        return 'mdi-circle-outline';
    }
}

/**
 * Format completion ratio for display
 * @param {number} completedCount - Number of completed details
 * @param {number} totalCount - Total number of details
 * @returns {string} Formatted ratio string
 */
export function formatCompletionRatio(completedCount, totalCount) {
    return `${completedCount}/${totalCount}`;
}

/**
 * Check if process can be marked as complete
 * @param {Array} detalles - Array of process details
 * @returns {boolean} True if all details are completed
 */
export function canCompleteProcess(detalles) {
    if (!detalles || detalles.length === 0) {
        return false;
    }

    return detalles.every(detail => detail.estado === true);
}

/**
 * Get next action suggestion based on process status
 * @param {Object} statusInfo - Status information from calculateProcessStatus
 * @returns {string} Suggested next action
 */
export function getNextActionSuggestion(statusInfo) {
    if (statusInfo.estado) {
        return 'Proceso completado';
    } else if (statusInfo.isPartiallyComplete) {
        const remaining = statusInfo.totalCount - statusInfo.completedCount;
        return `Completar ${remaining} detalle${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}`;
    } else {
        return 'Iniciar procesamiento de detalles';
    }
}

/**
 * Validate detail status change
 * @param {Object} detail - Detail object
 * @param {boolean} newStatus - New status value
 * @returns {Object} Validation result
 */
export function validateStatusChange(detail, newStatus) {
    const result = {
        isValid: true,
        errors: []
    };

    // Check if detail exists
    if (!detail) {
        result.isValid = false;
        result.errors.push('Detalle no encontrado');
        return result;
    }

    // Check if status is actually changing
    if (detail.estado === newStatus) {
        result.isValid = false;
        result.errors.push('El estado no ha cambiado');
        return result;
    }

    // Check if detail has required fields
    if (!detail.numOrden) {
        result.isValid = false;
        result.errors.push('Detalle sin número de orden');
    }

    if (!detail.cantidad || detail.cantidad <= 0) {
        result.isValid = false;
        result.errors.push('Detalle sin cantidad válida');
    }

    return result;
}

/**
 * Sort details by completion status (pending first, then completed)
 * @param {Array} detalles - Array of details to sort
 * @returns {Array} Sorted array
 */
export function sortDetailsByStatus(detalles) {
    if (!detalles || detalles.length === 0) {
        return [];
    }

    return [...detalles].sort((a, b) => {
        // Pending (false) first, then completed (true)
        if (a.estado === b.estado) {
            // If same status, sort by numOrden
            return (a.numOrden || '').localeCompare(b.numOrden || '');
        }
        return a.estado ? 1 : -1;
    });
}

/**
 * Group details by status
 * @param {Array} detalles - Array of details to group
 * @returns {Object} Grouped details
 */
export function groupDetailsByStatus(detalles) {
    if (!detalles || detalles.length === 0) {
        return {
            pending: [],
            completed: []
        };
    }

    return detalles.reduce((groups, detail) => {
        if (detail.estado) {
            groups.completed.push(detail);
        } else {
            groups.pending.push(detail);
        }
        return groups;
    }, {
        pending: [],
        completed: []
    });
}
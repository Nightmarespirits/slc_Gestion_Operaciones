// src/mockData/mockService.js
import {
    mockProcesos,
    mockMaquinas,
    mockResponsables,
    mockSedes,
    mockOperaciones,
    generateUniqueId
} from './procesos.js';

class MockApiService {
    constructor() {
        // Deep copy to prevent modifying original mock data
        this.procesos = JSON.parse(JSON.stringify(mockProcesos));
        this.maquinas = JSON.parse(JSON.stringify(mockMaquinas));
        this.responsables = JSON.parse(JSON.stringify(mockResponsables));
        this.sedes = JSON.parse(JSON.stringify(mockSedes));
        this.operaciones = JSON.parse(JSON.stringify(mockOperaciones));
    }

    // --- Métodos para Procesos ---
    getProcesos(tipo) {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (tipo) {
                    const filtered = this.procesos.filter(p => p.tipo === tipo);
                    resolve(filtered);
                } else {
                    resolve(this.procesos);
                }
            }, 200);
        });
    }

    getProcesoById(id) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const proceso = this.procesos.find(p => p._id === id);
                if (proceso) {
                    resolve(proceso);
                } else {
                    reject({ message: "Proceso no encontrado" });
                }
            }, 200);
        });
    }

    createProceso(procesoData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newProceso = {
                    ...procesoData,
                    _id: generateUniqueId('proc'),
                    fechaYHora: new Date().toISOString(),
                    // Ensure nested objects are handled correctly
                    sede: this.sedes.find(s => s._id === procesoData.sede._id),
                    responsable: this.responsables.find(r => r._id === procesoData.responsable._id),
                    detalles: procesoData.detalles.map(d => ({
                        ...d,
                        id: generateUniqueId('det'),
                        maquina: this.maquinas.find(m => m._id === d.maquina._id)
                    }))
                };
                this.procesos.push(newProceso);
                resolve(newProceso);
            }, 300);
        });
    }

    updateProceso(id, procesoData) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = this.procesos.findIndex(p => p._id === id);
                if (index !== -1) {
                    const updatedProceso = {
                        ...this.procesos[index],
                        ...procesoData,
                        _id: id, // Ensure ID is not changed
                        // Ensure nested objects are handled correctly
                        sede: this.sedes.find(s => s._id === procesoData.sede._id),
                        responsable: this.responsables.find(r => r._id === procesoData.responsable._id),
                        detalles: procesoData.detalles.map(d => ({
                            ...d,
                            // if detail has an id, keep it, otherwise generate a new one
                            id: d.id || d._id || generateUniqueId('det'),
                            maquina: this.maquinas.find(m => m._id === d.maquina?._id)
                        }))
                    };
                    this.procesos[index] = updatedProceso;
                    resolve(updatedProceso);
                } else {
                    reject({ message: "Proceso no encontrado para actualizar" });
                }
            }, 300);
        });
    }

    deleteProceso(id) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const initialLength = this.procesos.length;
                this.procesos = this.procesos.filter(p => p._id !== id);
                if (this.procesos.length < initialLength) {
                    resolve({ message: "Proceso eliminado exitosamente" });
                } else {
                    reject({ message: "Proceso no encontrado para eliminar" });
                }
            }, 300);
        });
    }

    // --- Métodos para Maquinas, Responsables, Sedes ---
    getMaquinas() {
        return Promise.resolve(this.maquinas);
    }

    getMaquinasByTipo(tipo) {
        const maquinasFiltradas = this.maquinas.filter(m => m.tipo === tipo);
        return Promise.resolve(maquinasFiltradas);
    }

    getResponsables() {
        return Promise.resolve(this.responsables);
    }

    getSedes() {
        return Promise.resolve(this.sedes);
    }

    getAllOperaciones() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.operaciones);
            }, 200);
        });
    }

    // --- Métodos para Operaciones ---
    getOperacionesPorEstado(estado) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const operaciones = this.operaciones.filter(op => op.estadoOperacion === estado);
                resolve(operaciones);
            }, 200);
        });
    }

    deleteOperacion(id) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = this.operaciones.findIndex(op => op._id === id);
                if (index !== -1) {
                    this.operaciones.splice(index, 1);
                    resolve({ message: 'Operación eliminada exitosamente' });
                } else {
                    reject(new Error('Operación no encontrada'));
                }
            }, 300);
        });
    }
}

export const mockApiService = new MockApiService();
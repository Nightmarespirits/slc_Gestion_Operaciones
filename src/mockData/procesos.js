// src/mockData/procesos.js

// Función para generar ID único
const generateUniqueId = (prefix) => {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
};

const mockSedes = [
  {
    _id: "sede_001",
    nombre: "Sede Principal"
  },
  {
    _id: "sede_002",
    nombre: "Sede Secundaria"
  }
];

const mockResponsables = [
  {
    _id: "resp_001",
    nombres: "Juan",
    apellidos: "Pérez"
  },
  {
    _id: "resp_002",
    nombres: "Ana",
    apellidos: "García"
  },
  {
    _id: "resp_003",
    nombres: "Carlos",
    apellidos: "López"
  }
];

const mockMaquinas = [
  {
    _id: "maq_001",
    nombre: "Lavadora Industrial 1",
    tipo: "lavado"
  },
  {
    _id: "maq_002",
    nombre: "Lavadora Industrial 2",
    tipo: "lavado"
  },
  {
    _id: "maq_003",
    nombre: "Secadora Industrial 1",
    tipo: "secado"
  },
  {
    _id: "maq_004",
    nombre: "Plancha Industrial 1",
    tipo: "planchado"
  },
  {
    _id: "maq_005",
    nombre: "Máquina de Teñido 1",
    tipo: "tenido"
  }
];

const mockProcesos = [
    // Lavado
    {
      _id: "proc_001",
      tipo: "lavado",
      operacion: "OP001",
      fechaYHora: "2025-06-28T10:30:00",
      responsable: mockResponsables[0],
      sede: mockSedes[0],
      estado: true,
      detalles: [
        { id: generateUniqueId('det'), numOrden: "NO001", maquina: mockMaquinas[0], cantidad: 5, colorMarcado: "rojo", obs: "Proceso completado con éxito" },
        { id: generateUniqueId('det'), numOrden: "NO001", maquina: mockMaquinas[0], cantidad: 3, colorMarcado: "verde", obs: "Sin observaciones" },
        { id: generateUniqueId('det'), numOrden: "NO002", maquina: mockMaquinas[1], cantidad: 7, colorMarcado: "azul", obs: "Revisar temperatura" }
      ]
    },
    {
      _id: "proc_002",
      tipo: "lavado",
      operacion: "OP002",
      fechaYHora: "2025-06-27T14:15:00",
      responsable: mockResponsables[1],
      sede: mockSedes[0],
      estado: false,
      detalles: [
        { id: generateUniqueId('det'), numOrden: "NO003", maquina: mockMaquinas[0], cantidad: 4, colorMarcado: "amarillo", obs: "Pendiente de revisión" }
      ]
    },
    // Secado
    {
      _id: "proc_003",
      tipo: "secado",
      operacion: "OP003",
      fechaYHora: "2025-06-28T11:00:00",
      responsable: mockResponsables[0],
      sede: mockSedes[0],
      estado: true,
      detalles: [
        { id: generateUniqueId('det'), numOrden: "NO004", maquina: mockMaquinas[2], cantidad: 8, colorMarcado: "verde", obs: "Proceso normal" }
      ]
    },
    // Planchado
    {
      _id: "proc_004",
      tipo: "planchado",
      operacion: "OP004",
      fechaYHora: "2025-06-28T09:45:00",
      responsable: mockResponsables[1],
      sede: mockSedes[1],
      estado: false,
      detalles: [
        { id: generateUniqueId('det'), numOrden: "NO005", maquina: mockMaquinas[3], cantidad: 6, colorMarcado: "rojo", obs: "En proceso" }
      ]
    },
    // Tenido
    {
      _id: "proc_005",
      tipo: "tenido",
      operacion: "OP005",
      fechaYHora: "2025-06-29T10:00:00",
      responsable: mockResponsables[2],
      sede: mockSedes[0],
      estado: true,
      detalles: [
        { id: generateUniqueId('det'), numOrden: "NO006", maquina: mockMaquinas[4], cantidad: 10, colorMarcado: "negro", obs: "Teñido profundo" }
      ]
    }
];

const mockOperaciones = [
    {
        _id: 'op_654321',
        procesos: [
            mockProcesos[0], // Lavado
            mockProcesos[3]  // Planchado
        ],
        createdAt: new Date('2023-10-26T10:00:00Z').toISOString(),
        fecInicio: new Date('2023-10-26T10:05:00Z').toISOString(),
        fecFinal: null,
        estadoOperacion: false, // Pendiente
        currentStage: 'planchado'
    },
    {
        _id: 'op_987654',
        procesos: [
            mockProcesos[2] // Secado
        ],
        createdAt: new Date('2023-10-27T11:00:00Z').toISOString(),
        fecInicio: new Date('2023-10-27T11:05:00Z').toISOString(),
        fecFinal: null,
        estadoOperacion: false, // Pendiente
        currentStage: 'secado'
    },
    {
        _id: 'op_123789',
        procesos: [
            mockProcesos[4], // Tenido
            mockProcesos[0] // Lavado
        ],
        createdAt: new Date('2023-10-28T09:00:00Z').toISOString(),
        fecInicio: new Date('2023-10-28T09:05:00Z').toISOString(),
        fecFinal: new Date('2023-10-28T12:00:00Z').toISOString(),
        estadoOperacion: true, // Finalizado
        currentStage: 'finalizado'
    }
];


export { mockProcesos, mockMaquinas, mockResponsables, mockSedes, mockOperaciones, generateUniqueId };
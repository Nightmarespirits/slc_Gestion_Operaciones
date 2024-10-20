// Procesar tabla (Merge)
export const mergeTableData = (data) => {
    if (!Array.isArray(data) || data.length === 0) return data; // Verificar que el array es válido
  
    const mergedData = [];
    let prevEncabezado1 = null,
        prevEncabezado2 = null;
    let rowspan1 = 0,
        rowspan2 = 0;
  
    data.forEach((row) => {
      // Inicializar siempre los atributos rowspan para evitar errores
      const newRow = { ...row, rowspan1: 1, rowspan2: 1 };
  
      // Si faltan las propiedades necesarias, solo agregamos la fila tal cual sin combinar
      if (row.numOrden === undefined || row.maquina?.nombre === undefined) {
        mergedData.push(newRow);
        return;
      }
  
      // Combinar numOrden
      if (row.numOrden === prevEncabezado1) {
        mergedData[rowspan1].rowspan1 += 1;
        newRow.rowspan1 = -1; // Se omite esta fila en la combinación
      } else {
        prevEncabezado1 = row.numOrden;
        rowspan1 = mergedData.length;
      }
  
      // Combinar maquina
      if (row.maquina.nombre === prevEncabezado2) {
        mergedData[rowspan2].rowspan2 += 1;
        newRow.rowspan2 = -1; // Se omite esta fila en la combinación
      } else {
        prevEncabezado2 = row.maquina.nombre;
        rowspan2 = mergedData.length;
      }
  
      mergedData.push(newRow);
    });
  
    return mergedData;
  };
  
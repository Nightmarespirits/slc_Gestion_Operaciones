//Procesar tabla (Merge)
export const mergeTableData = (data) => {
const mergedData = [];
let prevEncabezado1 = null,
    prevEncabezado2 = null;
let rowspan1 = 0,
    rowspan2 = 0;

data.forEach((row) => {
    const newRow = { ...row, rowspan1: 0, rowspan2: 0 };

    // Combine numOrden
    if (row.numOrden === prevEncabezado1) {
    mergedData[rowspan1].rowspan1 += 1;
    newRow.rowspan1 = -1;  // Se omite esta fila
    } else {
    newRow.rowspan1 = 1;
    prevEncabezado1 = row.numOrden;
    rowspan1 = mergedData.length;
    }

    // Combine maquina
    if (row.maquina === prevEncabezado2) {
    mergedData[rowspan2].rowspan2 += 1;
    newRow.rowspan2 = -1;  // Se omite esta fila
    } else {
    newRow.rowspan2 = 1;
    prevEncabezado2 = row.maquina;
    rowspan2 = mergedData.length;
    }

    mergedData.push(newRow);
});

return mergedData;
};
<template>
    <v-container>
        <!--Alert-->
        <v-alert
        v-model="alert"
        border="start"		
        close-label="Close Alert"
        color="orange-darken-4"
        variant="tonal"
        closable
        >
        {{ alertMsg }}
        </v-alert>
        <v-card>
            <v-text class="h1">
                Exportar Datos
            </v-text>
            <v-btn
            >Exportar Excel</v-btn>
        </v-card>
    </v-container>
</template>
<script setup>
import { computed, onMounted, ref, watch } from 'vue';

const alert = ref(false)
const alertMsg = ref('')

// Ejemplo usando fetch
const downloadReport = async (startDate, endDate) => {
    const response = await fetch(
        `/api/reportes/operaciones/excel?startDate=${startDate}&endDate=${endDate}`,
        { method: 'GET' }
    );
    
    if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-operaciones-${startDate}-${endDate}.xlsx`;
        a.click();
    }
};


const activeAlert = (msg) => {
    alertMsg.value = msg
    alert.value = true
    setTimeout(() => {
        alert.value = false
    }, 3000)
}
</script>
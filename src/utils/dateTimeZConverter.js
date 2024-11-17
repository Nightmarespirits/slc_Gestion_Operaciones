 //Zona Horaria
const zn = "America/Lima"

export const dateTimeZConverter = function (dateInput) {
    // Expresión regular para validar formato ISO 8601
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

    // Intentar crear un objeto Date con el argumento proporcionado
    const date = new Date(dateInput);

    // Validar si:
    // 1. La fecha es válida (no es NaN)
    // 2. El argumento cumple con el formato ISO 8601
    if (isNaN(date.getTime()) || !isoDateRegex.test(dateInput)) {
        return null
    }

    // Opciones para formatear la fecha
    const dateOptions = {
        weekday: "long", // Día de la semana completo (sábado, domingo...)
        day: "numeric", // Día del mes
        month: "long", // Mes completo (enero, febrero...)
        year: "numeric", // Año completo
        timeZone: zn, // Zona horaria especificada
    };

    // Opciones para formatear la hora
    const timeOptions = {
        hour: "2-digit", // Hora con 2 dígitos
        minute: "2-digit", // Minutos con 2 dígitos
        second: "2-digit", // Segundos con 2 dígitos
        hour12: false, // Formato 24 horas
        timeZone: zn, // Zona horaria especificada
    };

    // Formatear fecha y hora usando Intl.DateTimeFormat
    const formattedDate = new Intl.DateTimeFormat("es-ES", dateOptions).format(date);
    const formattedTime = new Intl.DateTimeFormat("es-ES", timeOptions).format(date);

    return `${formattedDate} ${formattedTime}`
};

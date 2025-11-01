const zn = "America/Lima";

export const dateTimeZConverter = function (fecha, hora = null) {
  if (!fecha) return null;

  // Si se incluye hora, la combinamos; si no, solo usamos la fecha
  const dateString = hora ? `${fecha} ${hora}` : fecha;

  // Crear el objeto Date
  const date = new Date(dateString);

  // Validar si la fecha es válida
  if (isNaN(date.getTime())) {
    console.warn("Fecha inválida:", dateString);
    return null;
  }

  // Opciones de formato
  const dateOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: zn,
  };

  const timeOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: zn,
  };

  // Formatear la fecha
  const formattedDate = new Intl.DateTimeFormat("es-PE", dateOptions).format(date);

  // Si hay hora, la añadimos también
  if (hora) {
    const formattedTime = new Intl.DateTimeFormat("es-PE", timeOptions).format(date);
    return `${formattedDate} ${formattedTime}`;
  }

  return formattedDate;
};


export const formatTimeAgo = (fechaCompleta) => {
  if (!fechaCompleta) return "";

  const now = new Date();
  const date = new Date(fechaCompleta);

  if (isNaN(date.getTime())) {
    console.warn("Fecha inválida:", fechaCompleta);
    return "";
  }

  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);

  // Caso 1: hace segundos
  if (diffMinutes < 1) {
    return "Hace unos segundos";
  }

  // Caso 2: hace minutos
  if (diffMinutes < 60) {
    return `hace ${diffMinutes} minuto${diffMinutes > 1 ? "s" : ""}`;
  }

  // Caso 3: hace una hora
  if (diffHours === 1) {
    return "hace 1 hora";
  }

  // Caso 4: más de una hora → mostrar hora exacta en Lima
  const options = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: zn,
  };
  const horaLima = new Intl.DateTimeFormat("es-PE", options).format(date);
  return horaLima;
};


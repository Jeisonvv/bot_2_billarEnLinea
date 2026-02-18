// Servicio para la lógica de respuesta del endpoint de pruebas
export function generarRespuesta(userId, message) {
  // Aquí va la lógica de negocio
  return `Hola ${userId || "usuario"}, recibí tu mensaje: ${message}`;
}

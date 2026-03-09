// tournamentRegister.helpers.js
// Helpers y configuración para el flujo de inscripción a torneos

export const TOURNAMENTS = [
  { id: 1, name: "Torneo Relámpago", description: "Torneo rápido de eliminación directa." },
  { id: 2, name: "Liga Semanal", description: "Competencia todos contra todos durante la semana." },
  { id: 3, name: "Copa de Campeones", description: "Solo para ganadores de torneos previos." }
];

export function getTournamentsList() {
  return TOURNAMENTS.map((t, idx) => `${idx + 1}. ${t.name} - ${t.description}`).join("\n");
}

export function findTournamentByName(text) {
  return TOURNAMENTS.find(t => text.toLowerCase().includes(t.name.toLowerCase()));
}

// Preguntas secuenciales para inscripción
export const preguntasTorneo = [
  { key: "nombre", text: "¿Cuál es tu nombre completo?" },
  { key: "tipoDocumento", text: "¿Qué tipo de documento tienes? (CC, TI, CE, etc.)" },
  { key: "numeroDocumento", text: "¿Cuál es tu número de documento?" }
];

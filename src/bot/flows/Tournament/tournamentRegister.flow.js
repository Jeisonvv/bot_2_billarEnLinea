// tournamentRegister.flow.js
// Flujo modular para inscripción a torneos con manejo de estados
import stateManager from '../../stateManager.js';
const { getStateData, setStateData, clearStateData } = stateManager;
import { TOURNAMENTS, getTournamentsList, findTournamentByName, preguntasTorneo } from './tournamentRegister.helpers.js';

export async function tournamentRegisterFlow(client, msg, state) {
  const user = msg.from;
  let stateData = await getStateData(user);
  const text = msg.body?.trim();


  // 0. Si hay una pregunta pendiente, guardar la respuesta
  if (stateData.ultimaPregunta) {
    stateData[stateData.ultimaPregunta] = text;
    delete stateData.ultimaPregunta;
    await setStateData(user, stateData);
  }

  // 1. Si no hay torneo elegido, mostrar lista y/o detectar por nombre
  if (!stateData.torneoElegido) {
    // Detectar si el mensaje es el nombre de un torneo
    let torneoDetectado = findTournamentByName(text || "");
    // Si no se detecta por nombre, intentar por número
    if (!torneoDetectado && text && /^\d+$/.test(text)) {
      const idx = parseInt(text, 10) - 1;
      if (idx >= 0 && idx < TOURNAMENTS.length) {
        torneoDetectado = TOURNAMENTS[idx];
      }
    }
    if (torneoDetectado) {
      stateData.torneoElegido = torneoDetectado;
      await setStateData(user, stateData);
      // Avanzar inmediatamente a la siguiente pregunta
      for (const pregunta of preguntasTorneo) {
        if (!stateData[pregunta.key]) {
          await client.sendMessage(user, pregunta.text);
          stateData.ultimaPregunta = pregunta.key;
          await setStateData(user, stateData);
          return;
        }
      }
      // Si ya tiene todos los datos (caso raro), finalizar
      await client.sendMessage(user, `✅ ¡Inscripción completa!\nTorneo: *${stateData.torneoElegido.name}*\nNombre: *${stateData.nombre}*\nTipo de documento: *${stateData.tipoDocumento}*\nNúmero de documento: *${stateData.numeroDocumento}*`);
      await clearStateData(user);
      // Cambiar estado a IDLE al finalizar inscripción
      const { setState } = await import('../../stateManager.js');
      await setState(user, "IDLE");
      return;
    } else {
      await client.sendMessage(user, `Estos son los torneos disponibles:\n\n${getTournamentsList()}\n\nResponde con el número o nombre del torneo para inscribirte.`);
      return;
    }
  }

  // 2. Preguntar datos secuenciales
  for (const pregunta of preguntasTorneo) {
    if (!stateData[pregunta.key]) {
      // Si falta este dato, preguntar
      await client.sendMessage(user, pregunta.text);
      // Guardar que estamos esperando este dato
      stateData.ultimaPregunta = pregunta.key;
      await setStateData(user, stateData);
      return;
    }
  }

  // 3. Si ya tenemos todos los datos, finalizar inscripción
  await client.sendMessage(user, `✅ ¡Inscripción completa!\nTorneo: *${stateData.torneoElegido.name}*\nNombre: *${stateData.nombre}*\nTipo de documento: *${stateData.tipoDocumento}*\nNúmero de documento: *${stateData.numeroDocumento}*`);
  // Aquí puedes guardar en base de datos si lo deseas
  await clearStateData(user);
  // Cambiar estado a IDLE al finalizar inscripción
  const { setState } = await import('../../stateManager.js');
  await setState(user, "IDLE");
}

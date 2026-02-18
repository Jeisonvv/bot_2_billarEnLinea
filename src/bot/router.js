// =============================
// router.js - Rutas y lógica de flujo del bot
// Enruta los mensajes recibidos y delega a los flujos o controladores correspondientes
// =============================

import { getState, setState } from "./stateManager.js";
import { classifyIntent } from "./aiClassifier.js";
import { storeFlow } from "./flows/store.flow.js";
import { eventsFlow } from "./flows/evnts/events.flow.js";
import { infoFlow } from "./flows/info.flow.js";
import { rafflesFlow } from "./flows/raffles.flow.js";
import { tournamentRegisterFlow } from "./flows/tournamentRegister.flow.js";
import { transmissionsFlow } from "./flows/transmissions/transmissions.flow.js";
import { billarInfoFlow } from "./flows/billarInfo.flow.js";
import { findOrCreateUser } from "../services/user.service.js";
import { handleTransmissionSteps } from "./flows/transmissions/transmission.handlers.js";
import { messageWelcome } from "../utils/messages.js";

import express from "express";
const router = express.Router();

// =============================
// handleMessage: Lógica principal para enrutar mensajes entrantes
// =============================
export const handleMessage = async (client, msg) => {
  // Simula que el bot está "escribiendo" antes de responder
  const user = msg.from;
  const text = msg.body?.toLowerCase().trim();
  const userData = await findOrCreateUser(user);
  if (!text) return;
  await findOrCreateUser(user);
  const currentState = await getState(user);

  // 1️⃣ Si ya está en un flujo activo, continuar ese flujo
  if (currentState && currentState !== "IDLE") {
    return continueFlow(client, msg, currentState);
  }

  // 2️⃣ Activar modo aprendizaje solo si está en IDLE
  if (text.includes("consejos") || text.includes("tips") || text === "6") {
    await setState(user, "BILLAR_INFO_MODE");
    return client.sendMessage(
      user,
      "🎱 *Modo aprendizaje activado*\n" +
        "Puedes preguntarme sobre:\n\n🎱 técnica\n🎱 reglas\n🎱 elección de equipo.\n" +
        "Escribe '*menu o salir*' para salir del modo aprendizaje."
    );
  }

  // 3️⃣ Si está libre, clasificar intención
  const intent = await classifyIntent(text);

  switch (intent) {
    case "STORE":
      return storeFlow(client, msg, userData);
    case "EVENTS":
      return eventsFlow(client, msg);
    case "INFO":
      return infoFlow(client, msg, userData);
    case "RAFFLES":
      return rafflesFlow(client, msg, userData);
    case "TOURNAMENT_REGISTER":
      return tournamentRegisterFlow(client, msg, userData);
    case "TRANSMISSIONS":
      return transmissionsFlow(client, msg, userData);
    default:
      // Responde con el mensaje de bienvenida si no reconoce la intención
      return client.sendMessage(user, messageWelcome(userData));
  }
};

// =============================
// continueFlow: Continúa el flujo activo según el estado del usuario
// =============================
const continueFlow = async (client, msg, state) => {
  const user = msg.from;
  const text = msg.body?.toLowerCase().trim();
  const userData = await findOrCreateUser(user);

  // Si el estado es de toma de control humano, el bot no responde
  if (state === "HUMAN_TAKEOVER") {
    return;
  }

  // Subflujo de transmisión
  if (typeof state === "string" && state.startsWith("TRANSMISSION_")) {
    return handleTransmissionSteps(client, msg, state, userData);
  }

  switch (state) {
    case "VIEWING_PRODUCTS":
      return client.sendMessage(
        user,
        "Selecciona un producto escribiendo su número."
      );
    case "BILLAR_INFO_MODE":
      if (["menu", "menú", "salir", "volver", "inicio", "exit", "main", "cancelar", "cancel", "home"].includes(text)) {
        await setState(user, "IDLE");
        return client.sendMessage(user, MAIN_MENU_MESSAGE);
      }
      return billarInfoFlow(client, msg);
  }
};

// =============================
// Endpoint para pruebas desde Postman
// =============================
import { handleMessagePostman } from "./controllers/message.controller.js";
router.post("/message", handleMessagePostman);

// Exporta el router para ser usado en app.js
export default router;

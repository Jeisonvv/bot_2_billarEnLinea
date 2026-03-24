import stateManager from "../stateManager.js"
const { setState } = stateManager
import { registerUserInteraction } from "../../services/user.service.js";
import { findOrCreateUser } from "../../services/user.service.js";
import { stateTypingDelay } from "../../utils/stateTipingDelay.js";

// Este archivo define el flujo para la tienda.
// Responde a los usuarios que preguntan por productos o servicios.

export const storeFlow = async (client, msg) => {
   await stateTypingDelay(msg);
     const user = msg.from;
   
     // 1️⃣ Aseguramos que el usuario exista en DB
     const userData = await findOrCreateUser("WHATSAPP", user);
   
     // 2️⃣ Registramos que mostró interés en tienda
     await registerUserInteraction({
       userId: userData?._id,
       interestType: "STORE",
       channel: "WHATSAPP"
     });
  await client.sendMessage(msg.from, "🛒 Bienvenido a la tienda. Pregunta por productos o servicios.");
};
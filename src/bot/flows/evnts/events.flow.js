// Este archivo define el flujo para eventos.
import { registerUserInteraction, findOrCreateUser } from "../../../services/user.service.js";

import { stateTypingDelay } from "../../../utils/stateTipingDelay.js";
// Responde a los usuarios que preguntan por torneos, eventos o actividades especiales.

export const eventsFlow = async (client, msg) => {
  await stateTypingDelay(msg);
   const user = msg.from;
 
   // 1️⃣ Aseguramos que el usuario exista en DB
   const userData = await findOrCreateUser("WHATSAPP", user);
 
   // 2️⃣ Registramos que mostró interés en eventos
   await registerUserInteraction({
     userId: userData?._id,
     interestType: "EVENTS",
     channel: "WHATSAPP"
   });

  await client.sendMessage(
    msg.from,
    "🎉 aqui podras ver los eventos y actividades especiales que tenemos para ti."
  );
};
// Este archivo define el flujo para eventos.
import { registerUserInteraction } from "../../services/user.service.js";
import { findOrCreateUser } from "../../services/user.service.js";
import { stateTypingDelay } from "../../utils/stateTipingDelay.js";
// Responde a los usuarios que preguntan por torneos, eventos o actividades especiales.

export const eventsFlow = async (client, msg) => {
  await stateTypingDelay(msg);
   const user = msg.from;
 
   // 1️⃣ Aseguramos que el usuario exista en DB
   const userData = await findOrCreateUser(user);
 
   // 2️⃣ Registramos que mostró interés en eventos
   await registerUserInteraction({
     whatsappId: user,
     interestType: "EVENTS",
     statusUpdate: "INTERESTED"
   });

  await client.sendMessage(
    msg.from,
    "🎉 Próximos eventos: Torneos, rifas y más. ¡Mantente atento!"
  );
};
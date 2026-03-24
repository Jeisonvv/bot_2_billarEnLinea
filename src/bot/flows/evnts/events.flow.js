// Este archivo define el flujo para eventos.
import { registerUserInteraction } from "../../../services/user.service.js";
import { updateContactLeadData } from "../../../services/contact-context.service.js";

import { stateTypingDelay } from "../../../utils/stateTipingDelay.js";
// Responde a los usuarios que preguntan por torneos, eventos o actividades especiales.

export const eventsFlow = async (client, msg, contactContext) => {
  await stateTypingDelay(msg);

   await updateContactLeadData(contactContext, { interestType: "EVENTS" });

   if (contactContext.persistedUser?._id) {
     await registerUserInteraction({
       userId: contactContext.persistedUser._id,
       interestType: "EVENTS",
       channel: "WHATSAPP"
     });
   }

  await client.sendMessage(
    msg.from,
    "🎉 aqui podras ver los eventos y actividades especiales que tenemos para ti."
  );
};
import stateManager from "../stateManager.js"
const { setState } = stateManager
import { registerUserInteraction } from "../../services/user.service.js";
import { updateContactLeadData } from "../../services/contact-context.service.js";
import { stateTypingDelay } from "../../utils/stateTipingDelay.js";

// Este archivo define el flujo para la tienda.
// Responde a los usuarios que preguntan por productos o servicios.

export const storeFlow = async (client, msg, contactContext) => {
   await stateTypingDelay(msg);

     await updateContactLeadData(contactContext, { interestType: "STORE" });

     if (contactContext.persistedUser?._id) {
       await registerUserInteraction({
         userId: contactContext.persistedUser._id,
         interestType: "STORE",
         channel: "WHATSAPP"
       });
     }
  await client.sendMessage(msg.from, "🛒 Bienvenido a la tienda. Pregunta por productos o servicios.");
};
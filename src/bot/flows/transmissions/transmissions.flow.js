import stateManager from "../../stateManager.js";
const { setState } = stateManager;
import { updateContactLeadData } from "../../../services/contact-context.service.js";
import { stateTypingDelay } from "../../../utils/stateTipingDelay.js";

export const transmissionsFlow = async (client, msg, contactContext) => {
  await stateTypingDelay(msg);
  const user = msg.from;
  const userData = contactContext.profile;

  await updateContactLeadData(contactContext, { interestType: "TRANSMISSION" });

  if (userData.name && userData.name.trim().length > 1) {
    await setState(user, "TRANSMISSION_CITY");

    return client.sendMessage(
      user,
      `Perfecto ${userData.name.split(" ")[0]} 🙌\n\n🏢 ¿Cómo se llama el billar?\n\nRecuerda que puedes escribir *"menu" o "cancelar"* en cualquier momento para volver al inicio.`
    );
  }

  await setState(user, "TRANSMISSION_INITIAL");

  return client.sendMessage(
    user,
    "🏆 *Transmisión de torneos*\n\nAntes de continuar, ¿con quién tengo el gusto?"
  );
};

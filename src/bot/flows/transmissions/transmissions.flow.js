import { setState } from "../../stateManager.js";
import { registerUserInteraction, findOrCreateUser } from "../../../services/user.service.js";
import { stateTypingDelay } from "../../../utils/stateTipingDelay.js";

export const transmissionsFlow = async (client, msg, userData) => {
  await stateTypingDelay(msg);
  const user = msg.from;

  // 2️⃣ Registramos interés solo si el status NO es 'QUOTED'
  const usuarioDb = await findOrCreateUser(user);
  if (usuarioDb.status !== "QUOTED") {
    await registerUserInteraction({
      whatsappId: user,
      interestType: "TRANSMISSION",
      statusUpdate: "INTERESTED"
    });
  }

  // 🔥 LÓGICA CLAVE:
  // Si ya tiene nombre → saltamos pedirlo
  if (userData.name && userData.name.trim().length > 1) {
    await setState(user, "TRANSMISSION_CITY");

    return client.sendMessage(
      user,
      `Perfecto ${userData.name} 🙌\n\n🏢 ¿Cómo se llama el billar?\n\nRecuerda que puedes escribir *"menu" o "cancelar"* en cualquier momento para volver al inicio.`
    );
  }

  // Si no tiene nombre → lo pedimos
  await setState(user, "TRANSMISSION_INITIAL");

  return client.sendMessage(
    user,
    "🏆 *Transmisión de torneos*\n\nAntes de continuar, ¿con quién tengo el gusto?"
  );
};

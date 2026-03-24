import stateManager from "../../stateManager.js";
const { setState, getStateData, setStateData, clearStateData } = stateManager;
import {
  ensurePersistedContact,
  updateContactLeadData,
} from "../../../services/contact-context.service.js";
import {
  upDateName,
  findOrCreateUser,
  updateUserPhoneAndName,
  registerUserInteraction,
} from "../../../services/user.service.js";
import { finalizarLeadTransmision } from "../../../utils/finalizarLeadTransmision.js";
import { messageWelcome } from "../../../utils/messages.js";
import { stateTypingDelay } from "../../../utils/stateTipingDelay.js";

function buildTransmissionLeadPayload(stateData) {
  return {
    ...(stateData.contactName && { name: stateData.contactName }),
    ...(stateData.contactPhone && { phone: String(stateData.contactPhone) }),
    ...(stateData.city && { city: stateData.city }),
    ...(stateData.billiardName && { businessName: stateData.billiardName }),
    interestType: "TRANSMISSION",
    extraData: {
      ...(stateData.tournamentType && { tournamentType: stateData.tournamentType }),
      ...(stateData.eventDate && { eventDate: stateData.eventDate }),
      ...(stateData.serviceType && { serviceType: stateData.serviceType }),
    },
  };
}

function isModernContactContext(contactContext) {
  return Boolean(contactContext?.provider && contactContext?.providerId);
}

export const handleTransmissionSteps = async (client, msg, state, contactContext) => {
    await stateTypingDelay(msg);
  const user = msg.from;
  const text = msg.body?.trim();
  const lowerText = text?.toLowerCase();
  const useModernContext = isModernContactContext(contactContext);
  const userData = useModernContext ? (contactContext.profile || {}) : (contactContext || {});

  if (["menu", "menú", "salir", "cancelar", "inicio"].includes(lowerText)) {
    clearStateData(user);
    await setState(user, "IDLE");

    return client.sendMessage(user, messageWelcome(userData));
  }

  const stateData = (await getStateData(user)) || {};

  const stateHandlers = {
    TRANSMISSION_INITIAL: async () => {
      if (userData.name && userData.name.trim().length > 1) {
        stateData.contactName = userData.name;
        await setStateData(user, stateData);
        if (useModernContext) {
          await updateContactLeadData(contactContext, { name: userData.name, interestType: "TRANSMISSION" });
        }
        await setState(user, "TRANSMISSION_CITY");
        return client.sendMessage(
          user,
          `Perfecto 🙌\n🏢 ¿Cómo se llama el billar?\n\nRecuerda que puedes escribir *"menu" o "cancelar"* en cualquier momento para volver al inicio.`,
        );
      }
      if (useModernContext) {
        await updateContactLeadData(contactContext, { name: text, interestType: "TRANSMISSION" });
      } else {
        const usuarioDb = await findOrCreateUser("WHATSAPP", user);
        await upDateName(usuarioDb._id, text);
      }
      stateData.contactName = text;
      await setStateData(user, stateData);
      await setState(user, "TRANSMISSION_CITY");
      return client.sendMessage(
        user,
        `Perfecto ${text} 🙌\n\n🏢 ¿Cómo se llama el billar?\n\nRecuerda que puedes escribir *\"menu\" o \"cancelar\"* en cualquier momento para volver al inicio.`,
      );
    },
    TRANSMISSION_CITY: async () => {
      stateData.billiardName = text;
      await setStateData(user, stateData);
      if (useModernContext) {
        await updateContactLeadData(contactContext, { businessName: text, interestType: "TRANSMISSION" });
      }
      await setState(user, "TRANSMISSION_TOURNAMENT_TYPE");
      return client.sendMessage(
        user,
        "📍 ¿En qué ciudad se realizará el torneo?",
      );
    },
    TRANSMISSION_TOURNAMENT_TYPE: async () => {
      stateData.city = text;
      await setStateData(user, stateData);
      if (useModernContext) {
        await updateContactLeadData(contactContext, { city: text, interestType: "TRANSMISSION" });
      }
      await setState(user, "TRANSMISSION_TOURNAMENT_SELECT");
      return client.sendMessage(
        user,
        "🎯 ¿Qué tipo de torneo será?\n\n1️⃣ Relámpago (1 día)\n2️⃣ Abierto (varios días)",
      );
    },
    TRANSMISSION_TOURNAMENT_SELECT: async () => {
      if (text === "1") stateData.tournamentType = "RELAMPAGO";
      else if (text === "2") stateData.tournamentType = "ABIERTO";
      else {
        return client.sendMessage(
          user,
          "Responde 1 para Relámpago o 2 para Abierto.",
        );
      }
      await setStateData(user, stateData);
      await setState(user, "TRANSMISSION_DATE");
      return client.sendMessage(user, "📅 ¿Qué fecha tienes prevista?");
    },
    TRANSMISSION_DATE: async () => {
      stateData.eventDate = text;
      await setStateData(user, stateData);
      await setState(user, "TRANSMISSION_SERVICE_TYPE");
      return client.sendMessage(
        user,
        "🎥 ¿Qué servicio necesitas?\n\n1️⃣ Solo Transmisión\n2️⃣ Solo Organización\n3️⃣ transmisión + organización",
      );
    },
    TRANSMISSION_SERVICE_TYPE: async () => {
      let serviceType;

      if (text === "1") serviceType = "TRANSMISION";
      else if (text === "2") serviceType = "ORGANIZACION";
      else if (text === "3") serviceType = "AMBOS";
      else {
        return client.sendMessage(user, "Por favor escribe 1, 2 o 3.");
      }

      stateData.serviceType = serviceType;
      await setStateData(user, stateData);
      if (useModernContext) {
        await updateContactLeadData(contactContext, buildTransmissionLeadPayload(stateData));
      }

      if (
        (typeof userData.phone === "number" && userData.phone.toString().length === 10) ||
        (typeof userData.phone === "string" && userData.phone.replace(/\D/g, "").length === 10)
      ) {
        stateData.contactPhone = Number(userData.phone);
        stateData.contactName = userData.name;
        await setStateData(user, stateData);

        const usuarioDb = useModernContext
          ? await ensurePersistedContact(contactContext, {
              leadData: buildTransmissionLeadPayload(stateData),
              qualified: true,
            })
          : await findOrCreateUser("WHATSAPP", user);

        await registerUserInteraction({
            userId: usuarioDb._id,
            interestType: "TRANSMISSION",
            channel: "WHATSAPP"
          });
        return await finalizarLeadTransmision(
          client,
          user,
          stateData,
          userData,
        );
      }

      await setState(user, "TRANSMISSION_CONTACT_PHONE");

      return client.sendMessage(
        user,
        "📱 Por favor escribe tu número de contacto para enviarle la cotización.",
      );
    },

    TRANSMISSION_CONTACT_PHONE: async () => {
      const phone = text.replace(/\D/g, ""); // Elimina todo lo que no sea dígito
      if (phone.length !== 10) {
        return client.sendMessage(
          user,
          "📱Por favor escribe un número válido de contacto. Para enviarle la cotización."
        );
      }
      stateData.contactPhone = Number(phone);
      await setStateData(user, stateData);

      const usuarioDb = useModernContext
        ? await ensurePersistedContact(contactContext, {
            leadData: buildTransmissionLeadPayload(stateData),
            qualified: true,
          })
        : await findOrCreateUser("WHATSAPP", user);

      if (!useModernContext) {
        await updateUserPhoneAndName(
          usuarioDb._id,
          stateData.contactPhone,
          stateData.contactName,
        );
      }

      await registerUserInteraction({
        userId: usuarioDb._id,
        interestType: "TRANSMISSION",
        channel: "WHATSAPP"
      });

      return await finalizarLeadTransmision(
        client,
        user,
        stateData,
        usuarioDb
      );
    },

  };

  if (stateHandlers[state]) {
    return await stateHandlers[state]();
  } else {
    return client.sendMessage(user, "Ocurrió un error. Intenta de nuevo.");
  }
};

import stateManager from "../bot/stateManager.js";
const { clearStateData, setState } = stateManager;

import { buildBackendUrl, fetchWithBackendAuth } from "../services/backend-auth.js";

export const finalizarLeadTransmision = async (client, user, stateData, usuarioDb) => {
  // Enviar solicitud al backend
  try {
    const payload = {
      contactName: stateData.contactName,
      contactPhone: stateData.contactPhone,
      billiardName: stateData.billiardName,
      city: stateData.city,
      tournamentType: stateData.tournamentType,
      eventDate: stateData.eventDate,
      serviceType: stateData.serviceType,
      whatsappId: user,
      comments: stateData.comments || ""
    };
    console.log("[BOT] Enviando solicitud de transmisión:", payload);
    await fetchWithBackendAuth(buildBackendUrl("/api/transmissions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("Error enviando solicitud de transmisión al backend:", err);
    // Puedes notificar al admin si falla
  }

  clearStateData(user);
  await setState(user, "HUMAN_TAKEOVER");

  await client.sendMessage(
    user,
    `✅ Gracias ${stateData.contactName}.\nNuestro equipo revisará la información y te enviará la propuesta en breve.`
  );

  await client.sendMessage(
    process.env.ADMIN_PHONE,
    `📢 NUEVO LEAD TRANSMISIÓN\n\n👤 Contacto: ${stateData.contactName}\n🏢 Billar: ${stateData.billiardName}\n📍 Ciudad: ${stateData.city}\n🎯 Tipo: ${stateData.tournamentType}\n📅 Fecha: ${stateData.eventDate}\n🎥 Servicio: ${stateData.serviceType}\n📱 Tel: ${stateData.contactPhone}`
  );
};

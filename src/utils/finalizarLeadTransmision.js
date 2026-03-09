import { clearStateData, setState } from "../bot/stateManager.js";
export const finalizarLeadTransmision = async (client, user, stateData, usuarioDb) => {

  // Aquí deberías hacer una petición HTTP al backend para crear el lead de transmisión
  // await fetch('http://tu-backend/api/transmission-leads', { method: 'POST', ... })

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

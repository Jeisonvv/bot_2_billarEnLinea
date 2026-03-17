// Obtener solo el estado conversacional de un usuario por canal
import { buildBackendUrl, fetchWithBackendAuth } from "./backend-auth.js";

export const getConversationState = async (userId, channel = "WHATSAPP") => {
  const res = await fetchWithBackendAuth(`${BASE_URL}/${userId}/conversation-state?channel=${channel}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
};
// Eliminado import de modelo User, solo se usan peticiones HTTP al backend
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const getNow = () => dayjs().tz("America/Bogota").toDate();


// 🔹 1️⃣ Encontrar o crear usuario
// Esta función busca un usuario por whatsappId. Si no existe, intenta crearlo.
// Si ocurre un error de duplicado (E11000), lo captura y retorna el usuario existente.


const BASE_URL = buildBackendUrl("/api/users");

// Buscar o crear usuario por canal y providerId
export const findOrCreateUser = async (provider, providerId) => {
  try {
    let res = await fetchWithBackendAuth(`${BASE_URL}/by-provider/${provider}/${providerId}`);
    if (res.ok) {
      const data = await res.json();
      // console.log("[findOrCreateUser] GET response:", data);
      return data.data;
    }
    // Si no existe, lo creas vía POST
    res = await fetchWithBackendAuth(`${BASE_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identities: [{ provider, providerId }]
      })
    });
    // Leer el body como texto una sola vez
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      console.log("[findOrCreateUser] POST response:", data);
      return data.data;
    } catch (err) {
      console.error("[findOrCreateUser] POST response no es JSON:", text);
      throw new Error(`Respuesta no válida del backend: ${text}`);
    }
  } catch (error) {
    console.error("[findOrCreateUser] Error:", error);
    throw error;
  }
};

// Registrar interacción/interés

export const registerUserInteraction = async ({ userId, interestType, channel }) => {
  if (!userId) {
    console.error("[registerUserInteraction] userId es undefined, abortando llamada.");
    return null;
  }
  // Obtener usuario
  let user = await fetchWithBackendAuth(`${BASE_URL}/${userId}`);
  if (!user.ok) return null;
  user = await user.json();
  user = user.data;

  // Actualizar intereses
  let interests = user.interests || [];
  const idx = interests.findIndex(i => i.type === interestType);
  if (idx !== -1) {
    interests[idx].count += 1;
    interests[idx].lastInteraction = new Date();
    interests[idx].channel = channel;
  } else {
    interests.push({ type: interestType, count: 1, lastInteraction: new Date(), channel });
  }

  // Log para depuración
  console.log("[registerUserInteraction] interests PATCH:", JSON.stringify(interests, null, 2));

  // Actualizar usuario
  const patchRes = await fetchWithBackendAuth(`${BASE_URL}/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interests })
  });
  const patchText = await patchRes.text();
  if (!patchRes.ok) {
    console.error("[registerUserInteraction] PATCH failed:", patchText);
  }
  try {
    const patchData = JSON.parse(patchText);
    console.log("[registerUserInteraction] PATCH response:", patchData);
  } catch (err) {
    console.error("[registerUserInteraction] PATCH response no es JSON:", patchText);
  }
  return { ...user, interests };
};

// Actualizar nombre
export const upDateName = async (userId, newName) => {
  if (!userId) {
    console.error("[upDateName] userId es undefined, abortando llamada.");
    return null;
  }
  await fetchWithBackendAuth(`${BASE_URL}/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName })
  });
  // Obtener el usuario actualizado (con autenticación)
  const res = await fetchWithBackendAuth(`${BASE_URL}/${userId}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
};

// Actualizar teléfono y nombre
export const updateUserPhoneAndName = async (userId, newPhone, newName) => {
  if (!userId) {
    console.error("[updateUserPhoneAndName] userId es undefined, abortando llamada.");
    return null;
  }
  await fetchWithBackendAuth(`${BASE_URL}/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: newPhone, name: newName })
  });
};

// Actualizar estado conversacional
export const updateConversationState = async (userId, channel, currentState, stateData = {}) => {
  if (!userId) {
    console.error("[updateConversationState] userId es undefined, abortando llamada.");
    return null;
  }
  await fetchWithBackendAuth(`${BASE_URL}/${userId}/conversation-state`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel, currentState, stateData })
  });
};
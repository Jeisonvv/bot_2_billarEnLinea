// Obtener solo el estado conversacional de un usuario por canal
export const getConversationState = async (userId, channel = "WHATSAPP") => {
  const res = await fetch(`${BASE_URL}/${userId}/conversation-state?channel=${channel}`, {
    headers: {
      "Authorization": `Bearer ${jwtToken}`
    }
  });
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


const BASE_URL = "http://localhost:3000/api/users";
const AUTH_URL = "http://localhost:3000/api/auth/login";

// Token JWT tomado de variable de entorno
import dotenv from "dotenv";
dotenv.config();
const jwtToken = process.env.BOT_JWT_TOKEN;

// Buscar o crear usuario por canal y providerId
export const findOrCreateUser = async (provider, providerId) => {
  try {
    // Esperar a que el bot esté autenticado
    if (!jwtToken) await loginBot();
    let res = await fetch(`${BASE_URL}/by-provider/${provider}/${providerId}`, {
      headers: {
        "Authorization": `Bearer ${jwtToken}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      // console.log("[findOrCreateUser] GET response:", data);
      return data.data;
    }
    // Si no existe, lo creas vía POST
    res = await fetch(`${BASE_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
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
  let user = await fetch(`${BASE_URL}/${userId}`, {
    headers: {
      "Authorization": `Bearer ${jwtToken}`
    }
  });
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
  const patchRes = await fetch(`${BASE_URL}/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${jwtToken}`
    },
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
  await fetch(`${BASE_URL}/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${jwtToken}`
    },
    body: JSON.stringify({ name: newName })
  });
  // Obtener el usuario actualizado (con autenticación)
  const res = await fetch(`${BASE_URL}/${userId}`, {
    headers: {
      "Authorization": `Bearer ${jwtToken}`
    }
  });
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
  await fetch(`${BASE_URL}/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${jwtToken}`
    },
    body: JSON.stringify({ phone: newPhone, name: newName })
  });
};

// Actualizar estado conversacional
export const updateConversationState = async (userId, channel, currentState, stateData = {}) => {
  if (!userId) {
    console.error("[updateConversationState] userId es undefined, abortando llamada.");
    return null;
  }
  await fetch(`${BASE_URL}/${userId}/conversation-state`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${jwtToken}`
    },
    body: JSON.stringify({ channel, currentState, stateData })
  });
};
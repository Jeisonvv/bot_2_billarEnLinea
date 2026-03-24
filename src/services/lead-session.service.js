import { buildBackendUrl, fetchWithBackendAuth } from "./backend-auth.js";

const BASE_URL = buildBackendUrl("/api/lead-sessions");

async function parseJsonResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Respuesta no válida del backend: ${text}`);
  }
}

export const getLeadSession = async (channel, providerId) => {
  const response = await fetchWithBackendAuth(`${BASE_URL}/${channel}/${providerId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const payload = await parseJsonResponse(response);
    throw new Error(payload?.message || "No fue posible consultar la sesión temporal.");
  }

  const payload = await parseJsonResponse(response);
  return payload.data;
};

export const ensureLeadSession = async (channel, providerId, payload = {}) => {
  const response = await fetchWithBackendAuth(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel, providerId, ...payload }),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "No fue posible crear o asegurar la sesión temporal.");
  }

  return data.data;
};

export const updateLeadSessionState = async (channel, providerId, currentState, stateData = {}) => {
  const response = await fetchWithBackendAuth(`${BASE_URL}/${channel}/${providerId}/state`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentState, stateData }),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "No fue posible actualizar el estado de la sesión temporal.");
  }

  return data.data;
};

export const updateLeadSessionData = async (channel, providerId, payload = {}) => {
  const response = await fetchWithBackendAuth(`${BASE_URL}/${channel}/${providerId}/data`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "No fue posible actualizar los datos de la sesión temporal.");
  }

  return data.data;
};

export const promoteLeadSession = async (channel, providerId) => {
  const response = await fetchWithBackendAuth(`${BASE_URL}/${channel}/${providerId}/promote`, {
    method: "POST",
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "No fue posible promover la sesión temporal.");
  }

  return data.data;
};
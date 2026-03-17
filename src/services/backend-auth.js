import dotenv from "dotenv";

dotenv.config();

function getBackendUrl() {
  return (process.env.BACKEND_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function getBotApiKey() {
  return process.env.BOT_API_KEY?.trim();
}

function getBotLoginEmail() {
  return process.env.BOT_LOGIN_EMAIL?.trim();
}

function getBotLoginPassword() {
  return process.env.BOT_LOGIN_PASSWORD;
}

let cachedJwtToken = "";
let loginPromise;

function normalizeHeaders(headers) {
  if (!headers) return {};
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return { ...headers };
}

function buildHeaders(extraHeaders = {}, token) {
  const botApiKey = getBotApiKey();

  return {
    ...normalizeHeaders(extraHeaders),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(botApiKey ? { "X-Bot-Token": botApiKey } : {}),
  };
}

async function loginBot(forceRefresh = false) {
  const loginEmail = getBotLoginEmail();
  const loginPassword = getBotLoginPassword();

  if (!forceRefresh && cachedJwtToken) {
    return cachedJwtToken;
  }

  if (!loginEmail || !loginPassword) {
    throw new Error("Faltan BOT_LOGIN_EMAIL o BOT_LOGIN_PASSWORD para autenticar el bot.");
  }

  if (loginPromise) {
    return loginPromise;
  }

  loginPromise = (async () => {
    const response = await fetch(`${getBackendUrl()}/api/auth/login`, {
      method: "POST",
      headers: buildHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        email: loginEmail,
        password: loginPassword,
      }),
    });

    const text = await response.text();
    let payload;

    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Login del bot devolvió una respuesta inválida: ${text}`);
    }

    if (!response.ok || !payload?.token) {
      const message = payload?.message || "No fue posible autenticar el bot contra el backend.";
      throw new Error(message);
    }

    cachedJwtToken = payload.token;
    return cachedJwtToken;
  })().finally(() => {
    loginPromise = undefined;
  });

  return loginPromise;
}

async function createAuthenticatedHeaders(headers, forceRefresh = false) {
  const token = await loginBot(forceRefresh);
  return buildHeaders(headers, token);
}

export function buildBackendUrl(path) {
  return `${getBackendUrl()}${path}`;
}

export async function fetchWithBackendAuth(input, init = {}, options = {}) {
  const { retryOnUnauthorized = true } = options;
  const loginEmail = getBotLoginEmail();
  const loginPassword = getBotLoginPassword();

  const headers = await createAuthenticatedHeaders(init.headers);
  let response = await fetch(input, {
    ...init,
    headers,
  });

  if (
    response.status === 401
    && retryOnUnauthorized
    && loginEmail
    && loginPassword
  ) {
    const retryHeaders = await createAuthenticatedHeaders(init.headers, true);
    response = await fetch(input, {
      ...init,
      headers: retryHeaders,
    });
  }

  return response;
}

export function clearCachedBotToken() {
  cachedJwtToken = "";
}
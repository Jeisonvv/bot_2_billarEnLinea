// =============================
// index.js - Controlador principal del bot
// Aquí se define la lógica del bot y los endpoints para modularidad.
// =============================

// Importa librerías y módulos necesarios
import path from "node:path";
import { fileURLToPath } from "node:url";
import whatsapp from "whatsapp-web.js";
const { Client, LocalAuth } = whatsapp;
import { handleMessage } from "./router.js";
import qrcode from "qrcode-terminal";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const authDataPath = process.env.WHATSAPP_AUTH_PATH
  ? path.resolve(process.env.WHATSAPP_AUTH_PATH)
  : path.resolve(currentDir, "../../.wwebjs_auth");
const authClientId = process.env.WHATSAPP_CLIENT_ID;
let clientInstance = null;
let isDestroyingClient = false;


// =============================
// Función para inicializar el bot de WhatsApp
// =============================
export const initBot = async () => {
  if (clientInstance) {
    return clientInstance;
  }

  const authStrategyOptions = {
    dataPath: authDataPath,
  };

  if (authClientId) {
    authStrategyOptions.clientId = authClientId;
  }

  const client = new Client({
    authStrategy: new LocalAuth(authStrategyOptions),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        // '--single-process',
        '--disable-gpu'
      ]
    }
  });
  clientInstance = client;
  // Manejo de errores críticos y desconexión
  client.on("disconnected", (reason) => {
    console.error("Cliente desconectado:", reason);
    clientInstance = null;
  });

  client.on("auth_failure", (msg) => {
    console.error("Fallo de autenticación:", msg);
    clientInstance = null;
  });

  client.on("error", (err) => {
    console.error("Error en el cliente:", err);
    clientInstance = null;
  });

  // Muestra el QR para conectar WhatsApp
  client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
    console.log("Escanea el QR mostrado arriba para conectar tu WhatsApp");
  });

  // Bot listo para recibir mensajes
  client.on("ready", () => {
    console.log("Bot listo 🎱");
    
  });

  // Maneja mensajes entrantes
  client.on("message", async (msg) => {
    // ❌ Ignorar mensajes propios
    if (msg.fromMe) return;

    // ❌ Ignorar grupos
    if (msg.from.endsWith("@g.us")) return;

    // ❌ Ignorar estados
    if (msg.from === "status@broadcast") return;

    // Llama a la función modular para manejar el mensaje
    await handleMessage(client, msg);
  });

  try {
    await client.initialize();
  } catch (error) {
    clientInstance = null;
    console.error('Error al inicializar el bot:', error);
  }

  return client;
};

export const stopBot = async () => {
  if (!clientInstance || isDestroyingClient) {
    return;
  }

  isDestroyingClient = true;

  try {
    await clientInstance.destroy();
  } catch (error) {
    console.error("Error al cerrar el bot:", error);
  } finally {
    clientInstance = null;
    isDestroyingClient = false;
  }
};
// =============================
// Endpoint para pruebas desde Postman
// Permite probar el bot enviando mensajes por HTTP
// =============================
export const handleMessagePostman = (req, res) => {
  const { userId, message } = req.body;
  // Aquí puedes agregar lógica personalizada
  res.json({ reply: `Hola ${userId || "usuario"}, recibí tu mensaje: ${message}` });
};

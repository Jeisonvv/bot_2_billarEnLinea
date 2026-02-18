// =============================
// index.js - Controlador principal del bot
// Aquí se define la lógica del bot y los endpoints para modularidad.
// =============================

// Importa librerías y módulos necesarios
import whatsapp from "whatsapp-web.js";
const { Client, LocalAuth } = whatsapp;
import { handleMessage } from "./router.js";
import qrcode from "qrcode-terminal";


// =============================
// Función para inicializar el bot de WhatsApp
// =============================
export const initBot = async () => {
  const client = new Client({
    authStrategy: new LocalAuth(),
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

  await client.initialize();
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

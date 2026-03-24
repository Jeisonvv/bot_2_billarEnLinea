// Manejo global de promesas no manejadas
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
// =============================
// app.js - Archivo principal del servidor
// Inicializa Express, conecta a la base de datos y configura rutas
// =============================

// Importar dependencias principales
import express from "express";
import { initBot, stopBot } from "./bot/index.js";
import botRouter from "./bot/router.js";

// =============================
// Conexión a la base de datos
// =============================

// =============================
// Inicialización de Express
// =============================
const app = express();
app.use(express.json()); // Permite recibir JSON en las peticiones

// =============================
// Ruta principal para verificar el estado del bot
// =============================
app.get("/", (req, res) => {
  res.send("Bot Billar en Línea activo 🎱");
});

// =============================
// Rutas del bot (modularizadas)
// =============================
app.use("/bot", botRouter);

// =============================
// Arranque del servidor y del bot de WhatsApp
// =============================
const server = app.listen(3000, async () => {
  console.log("Servidor corriendo en puerto 3000");
  await initBot();
});

let isShuttingDown = false;

const shutdown = async (signal) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`Cerrando servidor por ${signal}...`);

  try {
    await stopBot();
  } finally {
    server.close(() => {
      process.exit(0);
    });

    setTimeout(() => {
      process.exit(0);
    }, 5000).unref();
  }
};

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});
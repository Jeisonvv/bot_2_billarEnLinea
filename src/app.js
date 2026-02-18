// =============================
// app.js - Archivo principal del servidor
// Inicializa Express, conecta a la base de datos y configura rutas
// =============================

// Importar dependencias principales
import express from "express";
import { initBot } from "./bot/index.js";
import { connectDB } from "../database/mongo.js";
import botRouter from "./bot/router.js";

// =============================
// Conexión a la base de datos
// =============================
connectDB();

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
app.listen(3000, async () => {
  console.log("Servidor corriendo en puerto 3000");
  await initBot();
});
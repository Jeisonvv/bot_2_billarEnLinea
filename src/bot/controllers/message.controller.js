// src/bot/controllers/message.controller.js
// Controlador para el endpoint de pruebas desde Postman

import { generarRespuesta } from "../../services/message.service.js";

export const handleMessagePostman = (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Falta userId en la petición" });
    }
    if (!message) {
      return res.status(400).json({ error: "Falta message en la petición" });
    }
    const reply = generarRespuesta(userId, message);
    res.json({ reply });
  } catch (error) {
    console.error("Error en handleMessagePostman:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

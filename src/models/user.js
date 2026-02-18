// Importa mongoose para definir y exportar el modelo
import mongoose from "mongoose";

// Definición del esquema de usuario usando mongoose
const userSchema = new mongoose.Schema(
  {
    whatsappId: {
      type: String,
      required: true,
      unique: true,
    },
    // Número de teléfono del usuario (opcional)
    phone: Number,

    // Nombre del usuario (opcional)
    name: String,

    // Fuente por la que llegó el usuario (WhatsApp, Instagram, etc.)
    source: {
      type: String,
      enum: ["WHATSAPP", "INSTAGRAM", "FACEBOOK", "EVENT", "ORGANIC"],
      default: "WHATSAPP",
    },

    // Estado del usuario en el embudo de ventas
    status: {
      type: String,
      enum: ["NEW", "INTERESTED", "QUOTED", "CLIENT"],
      default: "NEW",
    },

    // Consentimiento para recibir marketing
    marketingConsent: {
      type: Boolean,
      default: false,
    },
    currentState: {
      type: String,
      default: "IDLE",
    },
    stateData: {
      type: Object,
      default: {},
    },

    tags: [String],

    // Intereses del usuario, es un array de objetos
    interests: [
      {
        type: {
          type: String,
          enum: ["STORE", "TRANSMISSION", "EVENTS", "RAFFLES"],
        },
        lastInteraction: Date, // Última vez que interactuó con ese interés
        count: {
          type: Number,
          default: 1,
        },
        channel: String, // Canal por el que interactuó
      },
    ],

    // Categoría del jugador (para usuarios de billar)
    playerCategory: {
      type: String,
      enum: ["TERCERA", "SEGUNDA", "PRIMERA", "ELITE"],
    },

    // Última interacción general del usuario
    lastInteraction: Date,
  },
  { timestamps: true },
); // timestamps agrega createdAt y updatedAt automáticamente

// Exporta el modelo de usuario para usarlo en otras partes del proyecto
export default mongoose.model("User", userSchema);

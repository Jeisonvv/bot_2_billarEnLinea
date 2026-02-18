// src/utils/mainMenu.js

export const messageWelcome = (userData) => {
  if (userData && userData.name) {
    return `¡${userData.name}! 👋\nBienvenido a Billar En Linea 🎱\n¿En qué podemos ayudarte hoy?:\n\n🛒 Tienda\n🏆 Transmisiones\n📝 Regístrate para torneos\n🎯 Eventos\n🎁 Sorteos\n`;
  } else {
    return `Bienvenido a Billar En Linea 🎱\n¿En qué podemos ayudarte hoy?:\n\n🛒 Tienda\n🏆 Transmisiones\n📝 Regístrate para torneos\n🎯 Eventos\n🎁 Sorteos\n`;
  }
};

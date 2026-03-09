
# BillarEnLinea Bot - Documentación del Proyecto

## Descripción General

Bot de WhatsApp para Billar en Línea, desarrollado en Node.js, Express y MongoDB, con integración de inteligencia artificial y flujos conversacionales para torneos, transmisiones, tienda, eventos y sorteos.

---

## Estructura del Proyecto

```
/database/
	mongo.js                # Conexión a MongoDB

/src/
	app.js                  # Inicialización de Express y del bot
	/bot/
		index.js              # Inicialización del cliente WhatsApp y eventos principales
		router.js             # Enrutador de flujos conversacionales
		stateManager.js       # Manejo de estados y datos temporales de usuario
		/controllers/
			message.controller.js
		/flows/
			billarInfo.flow.js
			info.flow.js
			raffles.flow.js
			store.flow.js
			/evnts/
				events.flow.js
			/transmissions/
				transmission.handlers.js
				transmissions.flow.js
			/Tournament/
				tournamentRegister.flow.js      # Flujo de inscripción a torneos (modular y con estados)
				tournamentRegister.helpers.js   # Helpers y preguntas para inscripción a torneos
		/models/
			TransmissionLead.js   # Modelo de leads para transmisiones
			user.js               # Modelo de usuario
		/services/
			message.service.js
			transmission.service.js
			user.service.js
		/utils/
			cleanPhone.js
			finalizarLeadTransmision.js
			messages.js
			stateTipingDelay.js

package.json
README.md
```

---

## Principales Flujos Conversacionales

### 1. **Torneos**
- Muestra torneos disponibles (array temporal).
- Permite elegir por nombre o número.
- Pregunta datos secuenciales: nombre, tipo de documento, número de documento.
- Guarda cada respuesta en el estado temporal del usuario.
- Al finalizar, muestra resumen y limpia el estado.
- Modularizado en:  
	- `tournamentRegister.flow.js` (flujo principal)
	- `tournamentRegister.helpers.js` (helpers y preguntas)

### 2. **Transmisiones**
- Flujo similar, pero con preguntas específicas para leads de transmisión.
- Guarda datos en el modelo TransmissionLead.
- Usa helpers y handlers para finalizar el lead y notificar al admin.

### 3. **Otros Flujos**
- Tienda, eventos, sorteos, info, etc., cada uno modularizado en su propio archivo de flujo.

---

## Manejo de Estados

- Cada usuario tiene un estado (`currentState`) y datos temporales (`stateData`) en la base de datos.
- El router detecta el estado y redirige los mensajes al flujo correspondiente.
- Al finalizar un flujo, el estado vuelve a "IDLE".

---

## Dependencias Clave

- `whatsapp-web.js` para integración con WhatsApp.
- `puppeteer` para automatización de navegador.
- `mongoose` para modelos y conexión a MongoDB.
- `express` para el servidor HTTP.
- `dotenv`, `dayjs`, `openai`, etc., para utilidades adicionales.

---

## Notas de Desarrollo

- El manejo de errores global está implementado en `app.js`.
- El flujo de torneos es completamente modular y fácil de extender.
- Para agregar nuevos flujos, crea un archivo en `/flows/` y agrégalo al router.

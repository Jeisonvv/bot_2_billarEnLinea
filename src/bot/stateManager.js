// Todas las funciones quedan vacías o retornan valores por defecto, ya que la lógica debe estar en el backend.



import { findOrCreateUser, updateConversationState, getConversationState } from "../services/user.service.js";

const CHANNEL = "WHATSAPP";


// Obtiene el estado actual del usuario desde el backend usando el nuevo endpoint
const getState = async (whatsappId) => {
	const user = await findOrCreateUser(CHANNEL, whatsappId);
	const state = await getConversationState(user._id, CHANNEL);
	return state?.currentState || "IDLE";
};

// Guarda el estado actual en el backend
const setState = async (whatsappId, state) => {
	const user = await findOrCreateUser(CHANNEL, whatsappId);
	const conversationState = await getConversationState(user._id, CHANNEL);
	await updateConversationState(user._id, CHANNEL, state, conversationState?.stateData || {});
};

// Guarda datos adicionales del estado conversacional
const setStateData = async (whatsappId, data) => {
	const user = await findOrCreateUser(CHANNEL, whatsappId);
	const conversationState = await getConversationState(user._id, CHANNEL);
	await updateConversationState(
		user._id,
		CHANNEL,
		conversationState?.currentState || "IDLE",
		data
	);
};


// Obtiene los datos adicionales del estado conversacional usando el nuevo endpoint
const getStateData = async (whatsappId) => {
	const user = await findOrCreateUser(CHANNEL, whatsappId);
	const state = await getConversationState(user._id, CHANNEL);
	return state?.stateData || {};
};

// Limpia los datos del estado conversacional
const clearStateData = async (whatsappId) => {
	const user = await findOrCreateUser(CHANNEL, whatsappId);
	await updateConversationState(user._id, CHANNEL, "IDLE", {});
};
export default {
	getState,
	setState,
	setStateData,
	getStateData,
	clearStateData
};

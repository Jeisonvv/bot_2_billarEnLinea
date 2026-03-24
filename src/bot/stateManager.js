import {
	ensureLeadSession,
	getLeadSession,
	updateLeadSessionState,
} from "../services/lead-session.service.js";
import {
	getConversationState,
	getUserById,
	getUserByProvider,
	updateConversationState,
} from "../services/user.service.js";

const CHANNEL = "WHATSAPP";

const getPersistedUser = async (whatsappId) => {
	const persistedUser = await getUserByProvider(CHANNEL, whatsappId);
	if (persistedUser?._id) {
		return persistedUser;
	}

	const session = await getLeadSession(CHANNEL, whatsappId);
	if (session?.persistedUserId) {
		return getUserById(String(session.persistedUserId));
	}

	return null;
};

const getSession = async (whatsappId) => {
	const session = await getLeadSession(CHANNEL, whatsappId);
	if (session) {
		return session;
	}

	return ensureLeadSession(CHANNEL, whatsappId);
	};


const getState = async (whatsappId) => {
	const persistedUser = await getPersistedUser(whatsappId);
	if (persistedUser?._id) {
		const state = await getConversationState(persistedUser._id, CHANNEL);
		return state?.currentState || "IDLE";
	}

	const session = await getSession(whatsappId);
	return session?.currentState || "IDLE";
};

const setState = async (whatsappId, state) => {
	const persistedUser = await getPersistedUser(whatsappId);
	if (persistedUser?._id) {
		const currentState = await getConversationState(persistedUser._id, CHANNEL);
		await updateConversationState(
			persistedUser._id,
			CHANNEL,
			state,
			currentState?.stateData || {},
		);
		return;
	}

	const session = await getSession(whatsappId);
	await updateLeadSessionState(CHANNEL, whatsappId, state, session?.stateData || {});
};

const setStateData = async (whatsappId, data) => {
	const persistedUser = await getPersistedUser(whatsappId);
	if (persistedUser?._id) {
		const currentState = await getConversationState(persistedUser._id, CHANNEL);
		await updateConversationState(
			persistedUser._id,
			CHANNEL,
			currentState?.currentState || "IDLE",
			data,
		);
		return;
	}

	const session = await getSession(whatsappId);
	await updateLeadSessionState(
		CHANNEL,
		whatsappId,
		session?.currentState || "IDLE",
		data
	);
};


const getStateData = async (whatsappId) => {
	const persistedUser = await getPersistedUser(whatsappId);
	if (persistedUser?._id) {
		const state = await getConversationState(persistedUser._id, CHANNEL);
		return state?.stateData || {};
	}

	const session = await getSession(whatsappId);
	return session?.stateData || {};
};

const clearStateData = async (whatsappId) => {
	const persistedUser = await getPersistedUser(whatsappId);
	if (persistedUser?._id) {
		await updateConversationState(persistedUser._id, CHANNEL, "IDLE", {});
		return;
	}

	await updateLeadSessionState(CHANNEL, whatsappId, "IDLE", {});
};
export default {
	getState,
	setState,
	setStateData,
	getStateData,
	clearStateData
};

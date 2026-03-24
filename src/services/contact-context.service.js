import {
  ensureLeadSession,
  promoteLeadSession,
  updateLeadSessionData,
} from "./lead-session.service.js";
import {
  getUserById,
  getUserByProvider,
  upDateName,
  updateUserPhoneAndName,
} from "./user.service.js";

function sanitizeString(value) {
  if (typeof value !== "string") return undefined;
  const sanitized = value.trim();
  return sanitized || undefined;
}

function normalizePhone(value) {
  if (value === undefined || value === null) return undefined;
  const digits = String(value).replace(/\D/g, "");
  return digits || undefined;
}

function buildLeadProfile(session) {
  const leadData = session?.leadData || {};
  const stateData = session?.stateData || {};

  return {
    _id: session?.persistedUserId || null,
    name: leadData.name || stateData.contactName || undefined,
    phone: leadData.phone || stateData.contactPhone || undefined,
    city: leadData.city || stateData.city || undefined,
    businessName: leadData.businessName || stateData.billiardName || undefined,
    status: session?.status,
  };
}

function mergeProfile(persistedUser, leadSession) {
  return {
    ...buildLeadProfile(leadSession),
    ...(persistedUser || {}),
    name: persistedUser?.name || buildLeadProfile(leadSession).name,
    phone: persistedUser?.phone || buildLeadProfile(leadSession).phone,
  };
}

function extractLeadDataFromUser(user) {
  if (!user) return {};

  return {
    ...(user.name && { name: user.name }),
    ...(user.phone && { phone: String(user.phone) }),
  };
}

export async function resolveContactContext(provider, providerId) {
  let persistedUser = await getUserByProvider(provider, providerId);

  let leadSession = null;

  if (persistedUser) {
    leadSession = null;
  } else {
    leadSession = await ensureLeadSession(provider, providerId, {
      ...(persistedUser?._id && { persistedUserId: persistedUser._id }),
      ...(persistedUser && { leadData: extractLeadDataFromUser(persistedUser) }),
    });
  }

  if (!persistedUser && leadSession?.persistedUserId) {
    persistedUser = await getUserById(String(leadSession.persistedUserId));

    if (persistedUser) {
      leadSession = await ensureLeadSession(provider, providerId, {
        persistedUserId: persistedUser._id,
        leadData: extractLeadDataFromUser(persistedUser),
      });
    }
  }

  return {
    kind: persistedUser ? "persisted" : "temporary",
    provider,
    providerId,
    persistedUser,
    leadSession,
    profile: mergeProfile(persistedUser, leadSession),
  };
}

export async function updateContactLeadData(contactContext, leadData = {}, options = {}) {
  const payload = {
    leadData,
    ...options,
  };

  const updatedSession = await updateLeadSessionData(
    contactContext.provider,
    contactContext.providerId,
    payload,
  );

  contactContext.leadSession = updatedSession;
  contactContext.profile = mergeProfile(contactContext.persistedUser, updatedSession);
  return contactContext;
}

export async function ensurePersistedContact(contactContext, options = {}) {
  const leadData = options.leadData || {};

  if (Object.keys(leadData).length > 0 || options.qualified !== undefined || options.status !== undefined) {
    await updateContactLeadData(contactContext, leadData, {
      ...(options.qualified !== undefined && { qualified: options.qualified }),
      ...(options.status !== undefined && { status: options.status }),
    });
  }

  if (contactContext.persistedUser?._id) {
    const name = sanitizeString(leadData.name) || sanitizeString(contactContext.profile?.name);
    const phone = normalizePhone(leadData.phone) || normalizePhone(contactContext.profile?.phone);

    if (name && phone) {
      await updateUserPhoneAndName(contactContext.persistedUser._id, Number(phone), name);
    } else if (name && !contactContext.persistedUser.name) {
      await upDateName(contactContext.persistedUser._id, name);
    }

    const refreshedUser = await getUserByProvider(contactContext.provider, contactContext.providerId)
      || await getUserById(contactContext.persistedUser._id);
    contactContext.persistedUser = refreshedUser || contactContext.persistedUser;
    contactContext.kind = "persisted";
    contactContext.profile = mergeProfile(contactContext.persistedUser, contactContext.leadSession);
    return contactContext.persistedUser;
  }

  const promoted = await promoteLeadSession(contactContext.provider, contactContext.providerId);
  contactContext.kind = "persisted";
  contactContext.persistedUser = promoted.user;
  contactContext.leadSession = promoted.session;
  contactContext.profile = mergeProfile(promoted.user, promoted.session);
  return promoted.user;
}
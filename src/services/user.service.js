import User from "../models/user.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const getNow = () => dayjs().tz("America/Bogota").toDate();


// 🔹 1️⃣ Encontrar o crear usuario
// Esta función busca un usuario por whatsappId. Si no existe, intenta crearlo.
// Si ocurre un error de duplicado (E11000), lo captura y retorna el usuario existente.
export const findOrCreateUser = async (userId) => {
  // userId es el ID completo de WhatsApp (ej: '123456789@c.us')
  let user = await User.findOne({ whatsappId: userId });
  if (!user) {
    try {
      user = await User.create({
        whatsappId: userId,
        lastInteraction: getNow()
      });
    } catch (err) {
      // Si ocurre un error de duplicado, buscamos el usuario y lo retornamos
      if (err.code === 11000) {
        // Comentario: Esto ocurre si dos procesos intentan crear el mismo usuario al mismo tiempo.
        // MongoDB lanza un error de clave duplicada (E11000). En ese caso, buscamos el usuario existente.
        user = await User.findOne({ whatsappId: userId });
      } else {
        throw err;
      }
    }
  }
  return user;
};

// 🔹 2️⃣ Registrar interacción (REUTILIZABLE PARA TODO)
export const registerUserInteraction = async ({
  whatsappId,
  interestType,
  statusUpdate = null
}) => {
  const user = await findOrCreateUser(whatsappId);

  const existingInterest = user.interests.find(
    (i) => i.type === interestType
  );

  if (existingInterest) {
    existingInterest.count += 1;
    existingInterest.lastInteraction = getNow();
  } else {
    user.interests.push({
      type: interestType,
      count: 1,
      lastInteraction: getNow(),
    });
  }

  user.lastInteraction = getNow();

  // Actualiza el status siempre que se reciba statusUpdate
  if (statusUpdate) {
    user.status = statusUpdate;
  }

  await user.save();

  return user;
};

export const upDateName = async (phone, newName) => {
  const user = await findOrCreateUser(phone);
  user.name = newName;
  await user.save();
  return user;
};

export const updateUserPhoneAndName = async (phone, newPhone, newName) => {
  const user = await findOrCreateUser(phone);
  user.phone = newPhone;
  user.name = newName;
  await user.save();
  return user;
};
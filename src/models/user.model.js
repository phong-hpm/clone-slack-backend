import { db } from "../database/index.js";

export const getUser = async (email) => {
  try {
    return db.data.users.find((user) => user.email === email);
  } catch {
    return null;
  }
};

export const createUser = async (user) => {
  try {
    db.data.users.push(user);
    await db.write();
    return true;
  } catch (e) {
    return false;
  }
};

export const updateRefreshToken = async (email, refreshToken) => {
  try {
    const user = db.data.users.find((user) => user.email === email);
    user.refreshToken = refreshToken;
    await db.write();
    return true;
  } catch {
    return false;
  }
};

import { getTable, writeData } from "../database/index.js";

export const getUser = async (email) => {
  try {
    const users = await getTable("users");
    return users.find((user) => user.email === email);
  } catch {
    return null;
  }
};

export const createUser = async (user) => {
  try {
    const users = await getTable("users");
    users.push(user);
    await writeData();
    return true;
  } catch (e) {
    return false;
  }
};

export const updateRefreshToken = async (email, refreshToken) => {
  try {
    const users = await getTable("users");
    const user = users.find((user) => user.email === email);
    user.refreshToken = refreshToken;
    await writeData();
    return true;
  } catch {
    return false;
  }
};

export const getUserView = async (id) => {
  try {
    const usersView = await getTable("usersView");
    return usersView[id];
  } catch {
    return null;
  }
};

import { getTable, writeData } from "../database/index.js";
import { generateId } from "../utils/generateId.js";

export const getUserById = async (id) => {
  try {
    const users = await getTable("users");
    return users.find((user) => user.id === id);
  } catch {
    return null;
  }
};

export const getUserByEmail = async (email) => {
  try {
    const users = await getTable("users");
    return users.find((user) => user.email === email);
  } catch {
    return null;
  }
};

export const createUser = async ({ email, password, name }) => {
  try {
    const id = `U-${generateId()}`;
    const users = await getTable("users");
    users.push({ id, email, password });
    await writeData();

    const usersView = await getTable("usersView");
    usersView[id] = { id, name, email, timeZone: "", teams: [] };
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

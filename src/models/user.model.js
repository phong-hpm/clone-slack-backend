import { getTable, writeData } from "../database/index.js";
import { generateId } from "../utils/generateId.js";

import * as authMethods from "../methods/auth.method.js";

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

export const createUser = async ({ name, email, password }) => {
  try {
    const id = `U-${generateId()}`;

    // add user
    const users = await getTable("users");
    users.push({ id, email, password, refreshToken: "" });
    await writeData();

    // add userView
    const usersView = await getTable("usersView");
    usersView[id] = { id, name, email, timeZone: "", teams: [] };
    await writeData();

    // setnew refresh token
    const refreshToken = await updateRefreshToken(id);

    return { userView: usersView[id], refreshToken };
  } catch (e) {
    return null;
  }
};

export const updateRefreshToken = async (id) => {
  try {
    // get refersh token
    const user = await getUserById(id);
    const refreshToken = await authMethods.generateRefreshToken({ id: user.id, email: user.email });

    user.refreshToken = refreshToken;
    await writeData();

    return refreshToken;
  } catch (e) {
    console.log(e);
    return null;
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

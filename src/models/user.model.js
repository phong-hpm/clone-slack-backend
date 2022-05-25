import { userInfoTable, usersTable } from "#database/apis/index.js";
import * as authMethods from "#methods/auth.method.js";
import { generateId } from "#utils/generateId.js";

export const getUserById = async (id) => {
  return usersTable.readById(id);
};

export const getUserView = async (id) => {
  return userInfoTable.readById(id);
};

export const getUserByEmail = async (email) => {
  const users = await usersTable.read();
  return Object.values(users).find((user) => user.email === email);
};

export const createUser = async ({ name, realname, email, password }) => {
  const id = `U-${generateId()}`;

  // add user
  await usersTable.insert(id, { id, email, password, refreshToken: "" });

  // add userView
  const userView = await userInfoTable.insert(id, {
    id,
    name,
    realname,
    email,
    timeZone: "",
    teams: [],
  });

  // setnew refresh token
  const refreshToken = await updateRefreshToken(id);

  return { userView, refreshToken };
};

export const updateRefreshToken = async (id) => {
  // get refersh token
  const user = await usersTable.readById(id);
  const refreshToken = await authMethods.generateRefreshToken({ id: user.id, email: user.email });

  await usersTable.update(id, { refreshToken });
  return refreshToken;
};

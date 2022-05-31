import { userInfoTable, usersTable } from "@database/apis";
import authMethod from "@methods/auth.method";
import { generateId } from "@utils/generateId";

import { UserInfoType } from "@database/apis/types";

const getById = async (id: string) => {
  return usersTable.readById(id);
};

const getUserInfosByIdList = async (idList: string[]) => {
  const list: Record<string, UserInfoType> = {};
  for (const id of idList) {
    const user = await userInfoTable.readById(id);
    if (user) list[id] = user;
  }
  return list;
};

const getByEmail = async (email: string) => {
  const users = await usersTable.read();
  return Object.values(users).find((user) => user.email === email);
};

const getUserInfo = async (id: string) => {
  return userInfoTable.readById(id);
};

const insertUser = async (data: {
  name: string;
  realname: string;
  email: string;
  password: string;
}) => {
  const { name, realname, email, password } = data;
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

const updateRefreshToken = async (id: string) => {
  // get refersh token
  const user = await usersTable.readById(id);
  const refreshToken = await authMethod.generateRefreshToken({ id: user.id, email: user.email });

  await usersTable.update(id, { refreshToken });
  return refreshToken;
};

const userModel = {
  getById,
  getByEmail,
  getUserInfo,
  getUserInfosByIdList,
  insertUser,
  updateRefreshToken,
};

export default userModel;

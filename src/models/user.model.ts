import { userInfoTable, usersTable } from "@database/apis";
import authMethod from "@methods/auth.method";
import { generateId } from "@utils/generateId";

import { UserInfoType } from "@database/apis/types";

const find = usersTable.find;

const getById = async (id: string) => {
  return usersTable.readById(id);
};

const getByEmail = async (email: string) => {
  return await usersTable.find({ email });
};

const getUserInfo = async (id: string) => {
  return userInfoTable.readById(id);
};

const getUserInfoByEmail = async (email: string) => {
  return userInfoTable.find({ email });
};

const getUserInfosByIdList = async (idList: string[]) => {
  const list: Record<string, UserInfoType> = {};
  for (const id of idList) {
    const user = await userInfoTable.readById(id);
    if (user) list[id] = user;
  }
  return list;
};

const insertUser = async (data: { name: string; email: string }) => {
  const { name, email } = data;
  const id = `U-${generateId()}`;
  const workspaceUrl = `${name.replace(/ /, "").toLocaleLowerCase()}workspace.slack.com`;

  // add user
  await usersTable.insert(id, { id, email, refreshToken: "" });

  // add userView
  await userInfoTable.insert(id, {
    id,
    name,
    email,
    realname: "",
    timeZone: "",
    teams: [],
    workspaceUrl,
  });

  // setnew refresh token
  const refreshToken = await updateRefreshToken(id);

  return { id, refreshToken };
};

const updateRefreshToken = async (id: string) => {
  const refreshToken = await authMethod.generateRefreshToken({ id });
  await usersTable.update(id, { refreshToken });
  return refreshToken;
};

const userModel = {
  find,
  getById,
  getByEmail,
  getUserInfo,
  getUserInfoByEmail,
  getUserInfosByIdList,
  insertUser,
  updateRefreshToken,
};

export default userModel;

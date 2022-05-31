import bcrypt from "bcrypt";

import authMethod from "@methods/auth.method";
import userModel from "@models/user.model";
import teamsService from "@services/team.service";

import { TeamType } from "@database/apis/types";
import { UserInfoViewType } from "@services/types";

const getById = async (id: string) => {
  return await userModel.getById(id);
};

const getUserInfosByIdList = async (idList: string[]) => {
  return await userModel.getUserInfosByIdList(idList);
};

const getByEmail = async (email: string) => {
  return await userModel.getByEmail(email);
};

const register = async (data: {
  name: string;
  realname: string;
  email: string;
  password: string;
}) => {
  const { name, realname, email, password } = data;

  const existedUser = await userModel.getByEmail(email);
  if (existedUser) return { error: "email already exists" };

  const hashPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  const { userView, refreshToken } = await userModel.insertUser({
    name,
    realname,
    email,
    password: hashPassword,
  });
  if (!userView) return { error: "Login failed, try later" };
  const accessToken = await authMethod.generateAccessToken({
    id: userView.id,
    email: userView.email,
  });

  return { data: { accessToken, refreshToken: refreshToken, userView } };
};

const login = async ({ email, password }: { email: string; password: string }) => {
  const user = await userModel.getByEmail(email);
  if (!user) return { error: "Couldn't find email" };
  if (!bcrypt.compareSync(password, user.password)) return { error: "Password is incorrect" };

  // update new refresh token
  const refreshToken = await userModel.updateRefreshToken(user.id);
  const accessToken = await authMethod.generateAccessToken({ id: user.id, email: user.email });
  if (!accessToken || !refreshToken) return { error: "Login failed, try later" };

  const userView = await userModel.getUserInfo(user.id);

  const data = {
    accessToken,
    refreshToken,
    userView,
  };

  return { data };
};

const getUserView = async (id: string) => {
  const userView = await userModel.getUserInfo(id);

  const teams: TeamType[] = [];
  for (let i = 0; i < userView.teams.length; i++) {
    const teamView = await teamsService.getById(userView.teams[i]);
    if (teamView) teams.push(teamView);
  }

  (userView as unknown as UserInfoViewType).teams = teams;

  return userView as unknown as UserInfoViewType;
};

const getUserInfo = async (id: string) => {
  return await userModel.getUserInfo(id);
};

const userService = {
  getByEmail,
  getUserInfosByIdList,
  getById,
  register,
  login,
  getUserInfo,
  getUserView,
};

export default userService;

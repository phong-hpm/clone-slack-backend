import bcrypt from "bcrypt";

import * as authMethods from "../methods/auth.method.js";

import * as teamsServices from "./teams.service.js";

import * as userModel from "../models/user.model.js";

export const getById = async (id) => {
  return await userModel.getUserById(id);
};

export const getByEmail = async (email) => {
  return await userModel.getUserByEmail(email);
};

export const register = async ({ name, email, password }) => {
  const existedUser = await getByEmail(email);
  if (existedUser) return { error: "email already exists" };

  const hashPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  const { userView, refreshToken } = await userModel.createUser({
    name,
    email,
    password: hashPassword,
  });
  if (!userView) return { error: "Login failed, try later" };
  const accessToken = await authMethods.generateAccessToken({
    id: userView.id,
    email: userView.email,
  });

  const data = {
    accessToken,
    refreshToken: refreshToken,
    userView,
  };

  return { data };
};

export const login = async ({ email, password }) => {
  const user = await getByEmail(email);
  if (!user) return { error: "Couldn't find email" };
  if (!bcrypt.compareSync(password, user.password)) return { error: "Password is incorrect" };

  const userView = await getUserView(user.id, {
    isDeep: true,
    teams: { isDeep: true, chanels: { isDeep: false } },
  });

  // update new refresh token
  const refreshToken = await userModel.updateRefreshToken(user.id);
  const accessToken = await authMethods.generateAccessToken({ id: user.id, email: user.email });
  if (!accessToken || !refreshToken) return { error: "Login failed, try later" };

  const data = {
    accessToken,
    refreshToken,
    userView,
  };

  return { data };
};

export const getUserView = async (id, options = {}) => {
  const userView = await userModel.getUserView(id);

  if (userView && options.isDeep) {
    if (options.teams && options.teams.isDeep) {
      const teams = [];
      for (let i = 0; i < userView.teams.length; i++) {
        const teamView = await teamsServices.getTeamView(
          userView.teams[i],
          userView.id,
          options.teams
        );
        if (teamView) teams.push(teamView);
      }

      userView.teams = teams;
    }
  }

  return userView;
};

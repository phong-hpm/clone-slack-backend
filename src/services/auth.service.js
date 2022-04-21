import bcrypt from "bcrypt";
import randToken from "rand-token";
import * as authMethods from "../methods/auth.method.js";

import * as teamsServices from "./teams.service.js";

import * as userModel from "../models/user.model.js";

export const getByEmail = async (email) => {
  return await userModel.getUser(email);
};

export const register = async (email, password, name) => {
  const existedUser = await getByEmail(email);
  if (existedUser) return { error: "email already exists" };

  const hashPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  const user = await userModel.createUser({ email, password: hashPassword, name });
  if (!user) return { error: "Login failed, try later" };

  return user;
};

export const login = async (email, password) => {
  const auth = await getByEmail(email);
  if (!auth) return { error: "Couldn't find email" };
  if (!bcrypt.compareSync(password, auth.password)) return { error: "Password is incorrect" };

  const userView = await getUserView(auth.id, {
    isDeep: true,
    teams: { isDeep: true, chanels: { isDeep: false } },
  });

  const accessToken = await authMethods.generateToken(
    { id: auth.id, email: auth.email },
    process.env.ACCESS_TOKEN_SECRET,
    process.env.ACCESS_TOKEN_LIFE
  );
  if (!accessToken) return { error: "Login failed, try later" };

  let refreshToken = auth.refreshToken || randToken.generate(32);
  if (!auth.refreshToken) {
    await userModel.updateRefreshToken(auth.email, refreshToken);
  }

  const data = {
    accessToken,
    // refreshToken,
    user: userView,
  };

  return { data };
};

export const getUserView = async (id, options = {}) => {
  const userView = await userModel.getUserView(id);

  if (userView && options.isDeep) {
    if (options.teams && options.teams.isDeep) {
      const teams = [];
      for (let i = 0; i < userView.teams.length; i++) {
        const teamView = await teamsServices.getTeamView(userView.teams[i], options.teams);
        if (teamView) teams.push(teamView);
      }

      userView.teams = teams;
    }
  }

  return userView;
};

import bcrypt from "bcrypt";
import randToken from "rand-token";
import * as authMethods from "../methods/auth.method.js";

import * as userModel from "../models/user.model.js";

export const getByEmail = async (email) => {
  return await userModel.getUser(email);
};

export const register = async (email, password) => {
  const existedUser = await getByEmail(email);
  if (existedUser) return { error: "email already exists" };

  const hashPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  const user = await userModel.createUser({ email, password: hashPassword });
  if (!user) return { error: "Login failed, try later" };

  return user;
};

export const login = async (email, password) => {
  const user = await getByEmail(email);
  if (!user) return { error: "Couldn't find email" };
  if (!bcrypt.compareSync(password, user.password)) return { error: "Password is incorrect" };

  const accessToken = await authMethods.generateToken(
    { email },
    process.env.ACCESS_TOKEN_SECRET,
    process.env.ACCESS_TOKEN_LIFE
  );
  if (!accessToken) return { error: "Login failed, try later" };

  let refreshToken = user.refreshToken || randToken.generate(32);
  if (!user.refreshToken) {
    await userModel.updateRefreshToken(user.email, refreshToken);
  }

  const data = {
    accessToken,
    refreshToken,
    user: {
      email: user.email,
      name: user.name,
    },
  };

  return { data };
};

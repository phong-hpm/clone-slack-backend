import * as authMethods from "../methods/auth.method.js";
import * as userModel from "../models/user.model.js";

export const authentication = async (req, res, next) => {
  const { error } = await verifyToken(req.cookies.accessToken);

  if (error) return res.status(401).send(error);

  const user = await userModel.getUserByEmail(verified.payload.email);
  const accessToken = await authMethods.refreshToken(verified.payload);
  res.cookie("accessToken", accessToken, { maxAge: process.env.ACCESS_TOKEN_LIFE, httpOnly: true });
  req.user = user;

  next();
};

export const verifyToken = async (token) => {
  const verified = await authMethods.decodeToken(token);

  if (!verified) return { error: "Token is invalid" };
  if (Date.now() > verified.exp * 1000) return { error: "Token is expired" };

  return {};
};

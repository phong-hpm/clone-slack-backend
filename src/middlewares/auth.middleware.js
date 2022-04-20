import * as authMethods from "../methods/auth.method.js";
import * as userModel from "../models/user.model.js";

export const authentication = async (req, res, next) => {
  const verified = await authMethods.decodeToken(req.cookies.accessToken);

  if (!verified) return res.status(401).send("Token is invalid");
  if (Date.now() > jwt.exp * 1000) return res.status(401).send("Token is expired");

  const user = await userModel.getUser(verified.payload.email);
  const accessToken = await authMethods.refreshToken(verified.payload);
  res.cookie("accessToken", accessToken, { maxAge: process.env.ACCESS_TOKEN_LIFE, httpOnly: true });
  req.user = user;

  next();
};

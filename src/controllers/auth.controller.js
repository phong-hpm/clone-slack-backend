import * as services from "../services/auth.service.js";
import * as authMethods from "../methods/auth.method.js";

export const register = async (req, res) => {
  const { email = "", password = "" } = req.body.postData;

  const { error } = await services.register(email, password);

  if (error) return res.status(400).send(error);

  res.send({ email });
};

export const login = async (req, res) => {
  const { email = "", password = "" } = req.body.postData || {};

  const { error, data } = await services.login(email, password);

  if (error) return res.status(401).send(error);

  res.cookie("accessToken", data.accessToken, { maxAge: process.env.ACCESS_TOKEN_LIFE, httpOnly: true });

  res.send(data);
};

export const refreshToken = async (req, res) => {
  if (!req.cookies.accessToken) return res.status(400).send("accessToken is required");

  const { refreshToken } = req.body.postData;
  if (!refreshToken) return res.status(400).send("refreshToken is required");

  const decoded = await authMethods.decodeToken(req.cookies.accessToken, process.env.ACCESS_TOKEN_SECRET);
  if (!decoded) return res.status(400).send("refeshToken is invalid");

  const user = await userModel.getUser(decoded.payload.email);
  if (!user) return res.status(401).send("Email doesn't exist");
  if (refreshToken !== user.refreshToken) return res.status(400).send("refreshToken is invalid");

  const accessToken = await authMethods.refreshToken(decoded.payload.email);
  if (!accessToken) return res.status(400).send("Refresh token failed, try later");

  return res.send({ accessToken });
};

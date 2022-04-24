import * as userServices from "../services/auth.service.js";
import * as authMethods from "../methods/auth.method.js";

export const getUserInfo = async (req, res) => {
  const options = {
    isDeep: true,
    teams: {
      isDeep: true,
    },
  };

  const user = await userServices.getUserView(req.user.id, options);
  res.send({ user });
};

export const register = async (req, res) => {
  const { email = "", password = "", name = "" } = req.body.postData;

  const { error, data } = await userServices.register({ name, email, password });
  if (error) return res.status(400).send(error);

  const response = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: { ...data.userView, teams: undefined },
    teams: data.userView.teams,
  };

  res.send(response);
};

export const login = async (req, res) => {
  const { email = "", password = "" } = req.body.postData || {};

  const { error, data } = await userServices.login({ email, password });
  if (error) return res.status(401).send(error);

  const response = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: { ...data.userView, teams: undefined },
    teams: data.userView.teams,
  };

  res.send(response);
};

export const verify = async (req, res) => {
  // check token
  const { payload, invalid, expired } = await authMethods.verifyToken(
    req.headers["x-access-token"]
  );
  if (invalid || expired) return res.send({ verified: false });

  // get data
  const { id, email } = payload;
  const newAccessToken = await authMethods.generateAccessToken({ id, email });
  const user = await userServices.getById(id);
  const userView = await userServices.getUserView(id, { isDeep: true, teams: { isDeep: true } });

  const response = {
    accessToken: newAccessToken,
    refreshToken: user.refreshToken,
    user: { ...userView, teams: undefined },
    teams: userView.teams,
  };

  res.send(response);
};

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body.postData || {};
  if (!refreshToken) return res.status(400).send("refreshToken is required");

  // check refresh token
  const { payload, invalid, expired, error } = await authMethods.verifyToken(refreshToken);
  if (invalid || expired) return res.status(400).send(error);

  // get data
  const { id, email } = payload;
  const user = await userServices.getByEmail(email);
  if (!user) return res.status(401).send("Email doesn't exist");
  if (refreshToken !== user.refreshToken) return res.status(400).send("refreshToken is invalid");

  const newAccessToken = await authMethods.generateAccessToken({ id, email });
  if (!newAccessToken) return res.status(400).send("Refresh token failed, try later");

  res.send({ accessToken: newAccessToken, refreshToken });
};

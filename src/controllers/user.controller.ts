import userService from "@services/user.service";
import authMethod from "@methods/auth.method";

import { RequestHandlerCustom } from "src/types";

const getUserInfo: RequestHandlerCustom = async (req, res) => {
  try {
    const user = await userService.getUserView(req.user.id);
    res.send({ user });
  } catch (e) {
    console.log(e);
  }
};

const register: RequestHandlerCustom = async (req, res) => {
  try {
    const { email = "", password = "", name = "", realname = "" } = req.body.postData;

    const { error, data } = await userService.register({ name, realname, email, password });
    if (error) return res.status(400).send(error);

    const response = {
      accessToken: (data as any).accessToken,
      refreshToken: (data as any).refreshToken,
      user: { ...(data as any).userView, teams: undefined },
      teams: (data as any).userView.teams,
    };

    res.send(response);
  } catch (e) {
    console.log(e);
  }
};

const login: RequestHandlerCustom = async (req, res) => {
  try {
    const { email = "", password = "" } = req.body.postData || {};

    const { error, data } = await userService.login({ email, password });
    if (error) return res.status(401).send(error);

    res.send({ accessToken: (data as any).accessToken, refreshToken: (data as any).refreshToken });
  } catch (e) {
    console.log(e);
  }
};

const refreshToken: RequestHandlerCustom = async (req, res) => {
  try {
    const { refreshToken } = req.body.postData || {};
    if (!refreshToken) return res.status(400).send("refreshToken is required");

    // check refresh token
    const { payload, invalid, expired, error } = await authMethod.verifyToken(refreshToken);
    if (invalid || expired) return res.status(400).send(error);

    // get data
    const { id, email } = payload;
    const user = await userService.getByEmail(email);

    if (!user) return res.status(401).send("Email doesn't exist");
    if (refreshToken !== user.refreshToken) return res.status(400).send("refreshToken is invalid");

    const newAccessToken = await authMethod.generateAccessToken({ id, email });
    if (!newAccessToken) return res.status(400).send("Refresh token failed, try later");

    if (process.env.NODE_ENV === "development") await (global as any).delay(1000);

    res.send({ accessToken: newAccessToken });
  } catch (e) {
    console.log(e);
  }
};

const userController = { getUserInfo, register, login, refreshToken };

export default userController;

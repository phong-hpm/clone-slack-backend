import userService from "@services/user.service";
import authMethod from "@methods/auth.method";

import { RequestHandlerCustom } from "src/types";
import { validateEmail } from "@utils/email";

const getUserInfo: RequestHandlerCustom = async (req, res) => {
  try {
    const user = await userService.getUserView(req.user.id);
    res.send({ ok: true, user });
  } catch (e) {
    res.send({ error: "user didn't existed" });
    console.log(e);
  }
};

const checkEmail: RequestHandlerCustom = async (req, res) => {
  try {
    const { email } = req.body.postData || {};
    if (!validateEmail(email)) return res.send({ error: "invalid email" });
    const userEmailVerifying = await userService.sendVerifyCode(email);
    res.send({ ok: true, verifyId: userEmailVerifying.id, email });
  } catch (e) {
    res.send({ error: "check email failed" });
    console.log(e);
  }
};

const confirmEmailCode: RequestHandlerCustom = async (req, res) => {
  try {
    const { email, verifyCode } = req.body.postData || {};
    const isValid = await userService.confirmVerifyCode({ email, verifyCode });
    if (!validateEmail(email) || !isValid) {
      return res.send({ error: "email and verifyCode are in valid" });
    }

    const existedUser = await userService.findUser({ email });

    let data: { accessToken?: string; refreshToken?: string; error?: string };

    if (existedUser) {
      data = await userService.login(email);
    } else {
      const name = email.split("@")[0];
      data = await userService.register({ name, email });
    }

    res.send({ ok: !data.error, ...data });
  } catch (e) {
    res.send({ error: "email and verifyCode are in valid" });
    console.log(e);
  }
};

const refreshToken: RequestHandlerCustom = async (req, res) => {
  try {
    const { refreshToken } = req.body.postData || {};
    if (!refreshToken) return res.status(400).send("refreshToken is required");

    // check refresh token
    const { payload, invalid, expired, error } = await authMethod.verifyToken(refreshToken);
    if (invalid || expired) return res.send({ error });

    // get data
    const { id } = payload;
    const user = await userService.getById(id);

    if (!user) return res.send({ error: "Email didn't existed" });
    if (refreshToken !== user.refreshToken) return res.status(400).send("refreshToken is invalid");

    const newAccessToken = await authMethod.generateAccessToken({ id });
    if (!newAccessToken) return res.send({ error: "Refresh token failed, try later" });

    if (process.env.NODE_ENV === "development") await (global as any).delay(1000);

    res.send({ ok: true, accessToken: newAccessToken });
  } catch (e) {
    res.send({ error: "refresh token failed" });
    console.log(e);
  }
};

const userController = { getUserInfo, checkEmail, confirmEmailCode, refreshToken };

export default userController;

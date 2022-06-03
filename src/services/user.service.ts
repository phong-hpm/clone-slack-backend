import { OAuth2Client } from "google-auth-library";

import authMethod from "@methods/auth.method";

import userEmailVerifyingModel from "@models/userEmailVerifying";
import userModel from "@models/user.model";

import teamsService from "@services/team.service";

import { TeamType } from "@database/apis/types";

import { emailTransporter, getEmailTemplate } from "@utils/email";

import { UserInfoViewType } from "@services/types";

const findUser = userModel.find;

const getById = async (id: string) => {
  return await userModel.getById(id);
};

const getUserInfosByIdList = async (idList: string[]) => {
  return await userModel.getUserInfosByIdList(idList);
};

const getByEmail = async (email: string) => {
  return await userModel.getByEmail(email);
};

const register = async ({ name, email }: { name: string; email: string }) => {
  const existedUser = await userModel.getByEmail(email);
  if (existedUser) return { error: "email already exists" };

  const { id, refreshToken } = await userModel.insertUser({ name, email });
  if (!id) return { error: "resgiter failed" };
  const accessToken = await authMethod.generateAccessToken({ id });

  return { accessToken, refreshToken };
};

const login = async (email: string) => {
  const userView = await userModel.getUserInfoByEmail(email);
  if (!userView) return { error: "Email is not existed" };

  const refreshToken = await userModel.updateRefreshToken(userView.id);
  const accessToken = await authMethod.generateAccessToken({ id: userView.id });
  if (!accessToken || !refreshToken) return { error: "Login failed" };

  return { accessToken, refreshToken };
};

// this service haven't finish yet
const verifyGoogleIdToken = async (idToken: string) => {
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  client.verifyIdToken;

  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  console.log("payload", payload);
};

const sendVerifyCode = async (email: string) => {
  const verifyNumber =
    process.env.NODE_ENV === "production" ? Math.floor(Math.random() * 1000000) : 111111;
  const verifyString = `${String(verifyNumber).slice(0, 3)}-${String(verifyNumber).slice(3)}`;

  let userEmailVerifying = await userEmailVerifyingModel.find({ email });

  if (userEmailVerifying) {
    await userEmailVerifyingModel.remove(userEmailVerifying.id);
  }
  userEmailVerifying = await userEmailVerifyingModel.insert({
    email,
    verifyCode: String(verifyNumber),
  });

  if (process.env.NODE_ENV === "production") {
    const mailOptions = {
      from: "Slack Clone <slackclonesup@gmail.com>",
      to: email,
      subject: `Slack confirmation code: ${verifyString}`,
      html: getEmailTemplate(verifyString),
    };

    // don't wait for [sendMail]
    emailTransporter.sendMail(mailOptions);
  }

  return userEmailVerifying;
};

const confirmVerifyCode = async ({ email, verifyCode }: { email: string; verifyCode: string }) => {
  const userEmailVerifying = await userEmailVerifyingModel.find({ email });
  const isValid = userEmailVerifying?.verifyCode === verifyCode;

  if (!isValid) return false;
  await userEmailVerifyingModel.remove(userEmailVerifying.id);
  return true;
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
  findUser,
  sendVerifyCode,
  confirmVerifyCode,
  getByEmail,
  getUserInfosByIdList,
  getById,
  register,
  login,
  getUserInfo,
  getUserView,
  verifyGoogleIdToken,
};

export default userService;

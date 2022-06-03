import jwt from "jsonwebtoken";
import { promisify } from "util";

import { TokenPayloadType } from "@methods/types";

const sign = promisify(jwt.sign).bind(jwt);
const verify = promisify(jwt.verify).bind(jwt);

const generateToken = async (payload: TokenPayloadType, expiresInSeconds: any) => {
  try {
    const token: string = await sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      algorithm: "HS256",
      expiresIn: expiresInSeconds,
    } as any);
    return token;
  } catch (error) {
    console.log(`Error in generate access token: + ${error}`);
    return null;
  }
};

const generateAccessToken = async (payload: TokenPayloadType) => {
  return generateToken(payload, Number(process.env.ACCESS_TOKEN_LIFE_SECONDS));
};

const generateRefreshToken = async (payload: TokenPayloadType) => {
  return generateToken(payload, Number(process.env.REFRESH_TOKEN_LIFE_DAYS) * 24 * 3600);
};

const verifyToken = async (token: string) => {
  try {
    const payload: any = await verify(token, process.env.ACCESS_TOKEN_SECRET, {
      ignoreExpiration: true,
    });

    if (!payload) return { error: "Token is invalid", invalid: true };
    if (Date.now() > payload.exp * 1000) return { error: "Token is expired", expired: true };

    return { payload };
  } catch (error) {
    console.log(`Error in decode access token: ${error}`);
    return { error: "verify failed" };
  }
};

const authMethod = { verifyToken, generateRefreshToken, generateAccessToken };

export default authMethod;

import { promisify } from "util";
import jwt from "jsonwebtoken";

const sign = promisify(jwt.sign).bind(jwt);
const verify = promisify(jwt.verify).bind(jwt);

const generateToken = async (payload, expiresIn) => {
  try {
    return await sign(payload, process.env.ACCESS_TOKEN_SECRET, { algorithm: "HS256", expiresIn });
  } catch (error) {
    console.log(`Error in generate access token: + ${error}`);
    return null;
  }
};

export const generateAccessToken = async (payload) => {
  return generateToken(payload, process.env.ACCESS_TOKEN_LIFE);
};

export const generateRefreshToken = async (payload) => {
  return generateToken(payload, process.env.REFRESH_TOKEN_LIFE);
};

export const verifyToken = async (token) => {
  try {
    const payload = await verify(token, process.env.ACCESS_TOKEN_SECRET, {
      ignoreExpiration: true,
    });

    if (!payload) return { error: "Token is invalid", invalid: true };
    if (Date.now() > payload.exp * 1000) return { error: "Token is expired", expired: true };

    return { payload };
  } catch (error) {
    console.log(`Error in decode access token: ${error}`);
    return { error: "verification was failed" };
  }
};

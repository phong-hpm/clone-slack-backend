import { promisify } from "util";
import jwt from "jsonwebtoken";

const sign = promisify(jwt.sign).bind(jwt);
const verify = promisify(jwt.verify).bind(jwt);

export const generateToken = async (payload, secretSignature, tokenLife) => {
  try {
    return await sign({ payload }, secretSignature, { algorithm: "HS256", expiresIn: tokenLife });
  } catch (error) {
    console.log(`Error in generate access token: + ${error}`);
    return null;
  }
};

export const decodeToken = async (token) => {
  try {
    return await verify(token, process.env.ACCESS_TOKEN_SECRET, {
      ignoreExpiration: true,
    });
  } catch (error) {
    console.log(`Error in decode access token: ${error}`);
    return null;
  }
};

export const refreshToken = async () => {
  const accessToken = await generateToken({ email }, process.env.ACCESS_TOKEN_SECRET, process.env.ACCESS_TOKEN_LIFE);
  return accessToken;
};

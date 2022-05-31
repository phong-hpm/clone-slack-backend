import authMethod from "@methods/auth.method";
import userModel from "@models/user.model";

import { RequestHandlerCustom } from "src/types";

export const authentication: RequestHandlerCustom = async (req, res, next) => {
  const token = req.headers["x-access-token"] as string;
  const { error, payload } = await authMethod.verifyToken(token);
  if (error) return res.status(401).send(error);

  const { id, email } = payload;
  const user = await userModel.getById(id);
  const accessToken = await authMethod.generateAccessToken({ id, email });

  req.user = { ...user, accessToken };

  next();
};

import * as authMethods from "#methods/auth.method.js";
import * as userModel from "#models/user.model.js";

export const authentication = async (req, res, next) => {
  const { error, payload } = await authMethods.verifyToken(req.headers["x-access-token"]);
  if (error) return res.status(401).send(error);

  const { id, email } = payload;
  const user = await userModel.getUserById(id);
  const accessToken = await authMethods.generateAccessToken({ id, email });

  req.user = { ...user, accessToken };

  next();
};

import Express from "express";

import { UserType } from "@database/apis/types";

export interface Request extends Express.Request {
  user: UserType & { accessToken: string };
}
export interface Response extends Express.Response {}
export interface NextFunction extends Express.NextFunction {}

export type RequestHandlerCustom = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

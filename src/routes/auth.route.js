import { Router } from "express";
import * as authController from "#controllers/auth.controller.js";
import { authentication } from "#middlewares/auth.middleware.js";

const router = new Router({ mergeParams: true });

router.get("/user", authentication, authController.getUserInfo);

router.post("/refresh-token", authController.refreshToken);
router.get("/verify", authController.verify);
router.post("/login", authController.login);
router.post("/register", authController.register);

export default router;

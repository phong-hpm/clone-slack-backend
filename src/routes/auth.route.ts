import { Router } from "express";

import authController from "@controllers/user.controller";
import { authentication } from "@middlewares/auth.middleware";

const router = Router({ mergeParams: true });

router.get("/user", authentication, authController.getUserInfo);
router.post("/refresh-token", authController.refreshToken);
router.post("/login", authController.login);
router.post("/register", authController.register);

export default router;

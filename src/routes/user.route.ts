import { Router } from "express";

import authController from "@controllers/user.controller";
import { authentication } from "@middlewares/auth.middleware";

const router = Router({ mergeParams: true });

router.get("/user", authentication, authController.getUserInfo);
router.post("/refresh-token", authController.refreshToken);
router.post("/check-email", authController.checkEmail);
router.post("/confirm-email-code", authController.confirmEmailCode);

export default router;

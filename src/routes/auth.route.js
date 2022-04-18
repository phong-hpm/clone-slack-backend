import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";

const router = new Router({ mergeParams: true });

router.post("/login", authController.login);
router.post("/register", authController.register);

export default router;

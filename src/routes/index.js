import { Router } from "express";

import authRoutes from "./auth.route.js";
import roomsRoutes from "./rooms.route.js";

import { authentication } from "../middlewares/auth.middleware.js";

const router = new Router({ mergeParams: true });

router.use("/auth", authRoutes);
router.use("/rooms", authentication, roomsRoutes);

export default router;

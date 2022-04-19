import { Router } from "express";

import authRoutes from "./auth.route.js";
import chanelsRoutes from "./chanels.route.js";

import { authentication } from "../middlewares/auth.middleware.js";

const router = new Router({ mergeParams: true });

router.use("/auth", authRoutes);
router.use("/chanels", authentication, chanelsRoutes);

export default router;

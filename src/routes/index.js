import { Router } from "express";

import authRoutes from "./auth.route.js";
import channelsRoutes from "./channels.route.js";

import { authentication } from "../middlewares/auth.middleware.js";

const router = new Router({ mergeParams: true });

router.use("/auth", authRoutes);
router.use("/channels", authentication, channelsRoutes);

export default router;

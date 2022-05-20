import { Router } from "express";

import authRoutes from "./auth.route.js";
import channelsRoutes from "./channels.route.js";
import messagesRoutes from "./messages.route.js";
import filesRoutes from "./files.route.js";

import { authentication } from "../middlewares/auth.middleware.js";

const router = new Router({ mergeParams: true });

router.use("/auth", authRoutes);
router.use("/files", filesRoutes);
router.use("/channels", authentication, channelsRoutes);
router.use("/message", authentication, messagesRoutes);

export default router;

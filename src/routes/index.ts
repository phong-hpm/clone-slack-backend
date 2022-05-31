import { Router } from "express";

import authRoutes from "@routes/auth.route";
import messagesRoutes from "@routes/messages.route";
import filesRoutes from "@routes/files.route";

import { authentication } from "@middlewares/auth.middleware";

const router = Router({ mergeParams: true });

router.use("/auth", authRoutes);
router.use("/files", filesRoutes);
router.use("/message", authentication, messagesRoutes);

export default router;

import { Router } from "express";

import messagesRoute from "./messages.route.js";

import * as channelsController from "../controllers/channels.controller.js";

const router = new Router({ mergeParams: true });

router.get("/", channelsController.getAll);
router.post("/", channelsController.add);
router.get("/:channelId", channelsController.getById);
router.use("/:channelId/messages", messagesRoute);

export default router;

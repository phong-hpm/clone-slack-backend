import { Router } from "express";

import messagesRoute from "./messages.route.js";

import * as chanelsController from "../controllers/chanels.controller.js";

const router = new Router({ mergeParams: true });

router.get("/", chanelsController.getAll);
router.post("/", chanelsController.add);
router.get("/:chanelId", chanelsController.getById);
router.use("/:chanelId/messages", messagesRoute);

export default router;

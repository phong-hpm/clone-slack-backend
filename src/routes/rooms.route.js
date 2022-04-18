import { Router } from "express";

import messagesRoute from "./messages.route.js";

import * as roomsController from "../controllers/rooms.controller.js";

const router = new Router({ mergeParams: true });

router.get("/", roomsController.getAll);
router.post("/", roomsController.add);
router.get("/:roomId", roomsController.getById);
router.use("/:roomId/messages", messagesRoute);

export default router;

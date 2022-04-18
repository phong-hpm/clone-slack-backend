import { Router } from "express";

import * as messagesController from "../controllers/messages.controller.js";

const router = new Router({ mergeParams: true });

router.get("/", messagesController.getAll);
router.post("/", messagesController.add);
router.get("/:messageId", messagesController.getById);
router.post("/:messageId", messagesController.updateById);

export default router;

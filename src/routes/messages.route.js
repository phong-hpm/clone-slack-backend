import { Router } from "express";

import * as messagesController from "../controllers/messages.controller.js";

const router = new Router({ mergeParams: true });

router.post("/upload-files", messagesController.uploadFiles);

export default router;

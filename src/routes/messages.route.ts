import { Router } from "express";

import messagesController from "@controllers/message.controller";

const router = Router({ mergeParams: true });

router.post("/upload-files", messagesController.uploadMessageWithFiles);

export default router;

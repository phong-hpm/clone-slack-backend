import { Router } from "express";

import * as filesController from "../controllers/files.controller.js";

const router = new Router({ mergeParams: true });

router.get("/image/:fileName", filesController.getImage);
router.get("/audio/:fileName", filesController.getAudio);
router.get("/video/:fileName", filesController.streamVideo);

export default router;

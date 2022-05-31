import { Router } from "express";

import filesController from "@controllers/file.controller";

const router = Router({ mergeParams: true });

router.get("/avatar/:fileName", filesController.getAvatar);
router.get("/image/:fileName", filesController.getImage);
router.get("/thumb/:fileName", filesController.getThumbnail);
router.get("/audio/:fileName", filesController.getAudio);
router.get("/video/:fileName", filesController.streamVideo);

router.get("/audio/download/:fileName", filesController.downloadAudio);
router.get("/video/download/:fileName", filesController.downloadVideo);

export default router;

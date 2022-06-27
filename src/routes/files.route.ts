import { Router } from "express";

import filesController from "@controllers/file.controller";

const router = Router({ mergeParams: true });

router.use((req, res, next) => {
  const maxAge = Number(process.env.CACHE_DAYS) * 86400;
  res.set({
    "Cache-Control": `public, max-age=${maxAge}`,
    Expires: new Date(Date.now() + maxAge * 1000).toUTCString(),
  });

  next();
});

router.get("/marketing/:page/:type/:fileName", filesController.getMarketingFile);
router.get("/avatar/:fileName", filesController.getAvatar);
router.get("/image/:fileName", filesController.getImage);
router.get("/thumb/:fileName", filesController.getThumbnail);
router.get("/audio/:fileName", filesController.getAudio);
router.get("/video/:fileName", filesController.streamVideo);

router.get("/audio/download/:fileName", filesController.downloadAudio);
router.get("/video/download/:fileName", filesController.downloadVideo);

export default router;

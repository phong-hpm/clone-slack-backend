import fs from "fs";
import fileService from "@services/file.service";
import { Request, RequestHandlerCustom, Response } from "src/types";

const getFile = (req: Request, res: Response, path: string) => {
  try {
    const { fileName } = req.params;
    const folderPath = `${process.cwd()}/src/_files`;
    const filePath = `${folderPath}/${path}/${fileName}`;
    if (fileService.checkFileExists(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send();
    }
  } catch (e) {
    console.log(e);
  }
};

const downloadFile = (req: Request, res: Response, type: string) => {
  try {
    const { fileName } = req.params;
    const folderPath = `${process.cwd()}/src/_files`;
    const filePath = `${folderPath}/${type}/${fileName}`;
    res.download(filePath);
  } catch (e) {
    console.log(e);
  }
};

const getMarketingFile: RequestHandlerCustom = async (req, res) => {
  const { page, type } = req.params;
  getFile(req, res, `marketing/${page}/${type}`);
};

const getAvatar: RequestHandlerCustom = async (req, res) => {
  getFile(req, res, "avatar");
};

const getImage: RequestHandlerCustom = async (req, res) => {
  getFile(req, res, "image");
};

const getThumbnail: RequestHandlerCustom = async (req, res) => {
  getFile(req, res, "thumb");
};

const getAudio: RequestHandlerCustom = async (req, res) => {
  getFile(req, res, "audio");
};

const downloadAudio: RequestHandlerCustom = async (req, res) => {
  downloadFile(req, res, "audio");
};

const streamVideo: RequestHandlerCustom = async (req, res) => {
  try {
    const { fileName } = req.params;
    const folderPath = `${process.cwd()}/src/_files`;
    const videoPath = `${folderPath}/video/${fileName}`;

    if (!fileService.checkFileExists(videoPath)) return res.status(404).send();

    const range = req.headers.range;
    if (!range) {
      return res.status(400).send("Requires Range header");
    }

    // get video stats (about 61MB)
    const videoSize = fs.statSync(videoPath).size;

    const chunkSize = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + chunkSize, videoSize - 1);

    // Create headers
    const contentLength = end - start + 1;
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
    };

    // HTTP Status 206 for Partial Content
    res.writeHead(206, headers);

    // create video read stream for this particular chunk
    const videoStream = fs.createReadStream(videoPath, { start, end });

    // Stream the video chunk to the client
    videoStream.pipe(res);
  } catch (e) {
    console.log(e);
  }
};

const downloadVideo: RequestHandlerCustom = async (req, res) => {
  downloadFile(req, res, "video");
};

const fileController = {
  getMarketingFile,
  getAvatar,
  getImage,
  getThumbnail,
  getAudio,
  downloadAudio,
  streamVideo,
  downloadVideo,
};

export default fileController;

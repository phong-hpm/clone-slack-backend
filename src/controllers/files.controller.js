import fs from "fs";
import { checkFileExists } from "#services/file.service.js";

const getFile = (req, res, type) => {
  try {
    const { fileName } = req.params;
    const folderPath = `${process.cwd()}/src/_files`;
    const filePath = `${folderPath}/${type}/${fileName}`;
    if (checkFileExists(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send();
    }
  } catch (e) {
    console.log(e);
  }
};

const downloadFile = (req, res, type) => {
  try {
    const { fileName } = req.params;
    const folderPath = `${process.cwd()}/src/_files`;
    const filePath = `${folderPath}/${type}/${fileName}`;
    res.download(filePath);
  } catch (e) {
    console.log(e);
  }
};

export const getAvatar = async (req, res) => {
  getFile(req, res, "avatar");
};

export const getImage = async (req, res) => {
  getFile(req, res, "image");
};

export const getThumbnail = async (req, res) => {
  getFile(req, res, "thumb");
};

export const getAudio = async (req, res) => {
  getFile(req, res, "audio");
};

export const downloadAudio = async (req, res) => {
  downloadFile(req, res, "audio");
};

export const streamVideo = async (req, res) => {
  try {
    const { fileName } = req.params;
    const folderPath = `${process.cwd()}/src/_files`;
    const videoPath = `${folderPath}/video/${fileName}`;

    if (!checkFileExists(videoPath)) return res.status(404).send();

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

export const downloadVideo = async (req, res) => {
  downloadFile(req, res, "video");
};

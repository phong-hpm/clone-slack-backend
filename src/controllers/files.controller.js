import fs from "fs";
import { checkFileExists } from "../services/file.service.js";

export const getImage = async (req, res) => {
  const { fileName } = req.params;
  const folderPath = `${process.cwd()}/src/_files`;
  const filePath = `${folderPath}/image/${fileName}`;
  if (checkFileExists(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send();
  }
};

export const getAudio = async (req, res) => {
  const { fileName } = req.params;
  const folderPath = `${process.cwd()}/src/_files`;
  const filePath = `${folderPath}/audio/${fileName}`;
  if (checkFileExists(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send();
  }
};

export const streamVideo = async (req, res) => {
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
};

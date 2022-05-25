import fs from "fs";
import { URL } from "url";
import { Readable } from "stream";
import { v4 as uuid } from "uuid";

export const mimeType = {
  VIDEO: "video/webm",
  AUDIO: "audio/webm",
  THUMB: "imgage/png",
  JSON: "application/json",
};
export const typePaths = { VIDEO: "video", AUDIO: "audio", THUMB: "thumb" };
export const fileExtension = { VIDEO: "mp4", AUDIO: "wav", THUMB: "png" };

const getExtensionByType = (type) => {
  if (type === typePaths.VIDEO) return fileExtension.VIDEO;
  if (type === typePaths.AUDIO) return fileExtension.AUDIO;
  if (type === typePaths.THUMB) return fileExtension.THUMB;
  return null;
};

export const checkFileExists = (path) => {
  try {
    return fs.existsSync(path);
  } catch (err) {
    return false;
  }
};

export const uploadFile = async (file) => {
  const folderPath = `${process.cwd()}/src/_files`;
  let typePath = "";
  let fileName = "";

  if (file.mimetype === "video/webm") {
    typePath = typePaths.VIDEO;
  } else if (file.mimetype === "audio/webm") {
    typePath = typePaths.AUDIO;
  } else if (file.mimetype.split("/")[0] === "image") {
    typePath = typePaths.THUMB;
  }

  if (typePath) {
    fileName = `${uuid()}.${getExtensionByType(typePath)}`;
    const url = `${global.domain}/files/${typePath}/${fileName}`;
    const filePath = `${folderPath}/${typePath}/${fileName}`;

    const webmReadable = new Readable();
    webmReadable._read = () => {};
    webmReadable.push(file.data);

    webmReadable.push(null);
    const outputWebmStream = fs.createWriteStream(filePath);
    webmReadable.pipe(outputWebmStream);

    if (process.env.NODE_ENV === "development") await global.delay(500);

    return { id: file.name, url, type: typePath };
  }
  return null;
};

export const uploadFileList = async (files) => {
  const dataArr = [];

  for (const file of files) {
    const data = await uploadFile(file);
    if (data) dataArr.push(data);
  }

  return { data: dataArr };
};

const deleteFileByUrl = async (url) => {
  try {
    const rootPath = `${process.cwd()}/src`;
    const pathName = new URL(url).pathname;
    const pathFile = `_${pathName.slice(1)}`;

    if (url) {
      const filePath = `${rootPath}/${pathFile}`;
      if (checkFileExists(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch {
    console.log("file is not exist");
  }
};

export const deleteFile = async (file) => {
  deleteFileByUrl(file.url);
  deleteFileByUrl(file.thumb);
  file.thumbList.forEach((url) => deleteFileByUrl(url));
};

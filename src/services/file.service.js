import fs from "fs";
import { URL } from "url";
import { Readable } from "stream";
import { v4 as uuid } from "uuid";

const typePaths = { VIDEO: "video", AUDIO: "audio", IMAGE: "image" };
const fileExtension = { VIDEO: "mp4", AUDIO: "wav", IMAGE: "png" };

const getExtensionByType = (type) => {
  if (type === typePaths.VIDEO) return fileExtension.VIDEO;
  if (type === typePaths.AUDIO) return fileExtension.AUDIO;
  if (type === typePaths.IMAGE) return fileExtension.IMAGE;
  return null;
};

export const checkFileExists = (path) => {
  try {
    return fs.existsSync(path);
  } catch (err) {
    return false;
  }
};

export const uploadFiles = async (files) => {
  const folderPath = `${process.cwd()}/src/_files`;

  const data = [];

  files.forEach((file) => {
    let typePath = "";
    let fileName = "";

    if (file.mimetype === "video/webm") {
      typePath = typePaths.VIDEO;
    } else if (file.mimetype === "audio/webm") {
      typePath = typePaths.AUDIO;
    } else if (file.mimetype.split("/")[0] === "image") {
      typePath = typePaths.IMAGE;
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

      data.push({ id: file.id, url, type: typePath });
    }
  });

  return { data };
};

const deleteFileByUrl = (url) => {
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
};

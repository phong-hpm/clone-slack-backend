import fs from "fs";
import { URL } from "url";
import { Readable } from "stream";
import { v4 as uuid } from "uuid";

import { InputFileType } from "@services/types";
import { MessageFileType } from "@database/apis/types";

export const mimeType = {
  VIDEO: "video/webm",
  AUDIO: "audio/webm",
  THUMB: "imgage/png",
  JSON: "application/json",
};
export const typePaths = { VIDEO: "video", AUDIO: "audio", THUMB: "thumb" };
export const fileExtension = { VIDEO: "mp4", AUDIO: "wav", THUMB: "png" };

const getExtensionByType = (type: string) => {
  if (type === typePaths.VIDEO) return fileExtension.VIDEO;
  if (type === typePaths.AUDIO) return fileExtension.AUDIO;
  if (type === typePaths.THUMB) return fileExtension.THUMB;
  return null;
};

const deleteFileByUrl = async (url: string) => {
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

const checkFileExists = (path: string) => {
  try {
    return fs.existsSync(path);
  } catch (err) {
    return false;
  }
};

const upload = async (file: InputFileType) => {
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
    // eslint-disable-next-line @typescript-eslint/no-empty-function
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

const uploadFileList = async (files: InputFileType[]) => {
  const dataArr = [];

  for (const file of files) {
    const data = await upload(file);
    if (data) dataArr.push(data);
  }

  return { data: dataArr };
};

const remove = async (file: MessageFileType) => {
  deleteFileByUrl(file.url);
  deleteFileByUrl(file.thumb);
  file.thumbList.forEach((url) => deleteFileByUrl(url));
};

const fileService = {
  mimeType,
  typePaths,
  fileExtension,
  checkFileExists,
  upload,
  uploadFileList,
  remove,
};

export default fileService;

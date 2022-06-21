import fs from "fs";
import { URL } from "url";
import imageSize from "image-size";
import { Readable } from "stream";

import { InputFileType } from "@services/types";
import { MessageFileType } from "@database/apis/types";
import { generateId } from "@utils/generateId";

export const mimeType = {
  VIDEO: "video/webm",
  AUDIO: "audio/webm",
  IMAGE: "imgage/png",
  THUMB: "imgage/png",
  JSON: "application/json",
};
export const typePaths = { VIDEO: "video", AUDIO: "audio", IMAGE: "image", THUMB: "thumb" };
export const fileExtension = { VIDEO: "mp4", AUDIO: "wav", IMAGE: "png", THUMB: "png" };

const getExtensionByType = (type: string) => {
  if (type === typePaths.VIDEO) return fileExtension.VIDEO;
  if (type === typePaths.AUDIO) return fileExtension.AUDIO;
  if (type === typePaths.IMAGE) return fileExtension.IMAGE;
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
  let ratio = 0;

  if (file.type === "video") {
    typePath = typePaths.VIDEO;
  } else if (file.type === "audio") {
    typePath = typePaths.AUDIO;
  } else if (file.type === "image") {
    typePath = typePaths.IMAGE;
    const { width, height } = imageSize(file.data);
    ratio = height / width;
  } else if (file.type === "thumb") {
    typePath = typePaths.THUMB;
  }

  if (typePath) {
    fileName = `${generateId()}.${getExtensionByType(typePath)}`;
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

    return { id: file.name, url, type: typePath, ratio };
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

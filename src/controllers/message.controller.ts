import { MessageType } from "@database/apis/types";

import fileService from "@services/file.service";
import messagesService from "@services/message.service";

import { SocketEvent } from "@utils/constant";

import { InputFileType } from "@services/types";

import { Request, RequestHandlerCustom } from "src/types";

const readFileAsArray = (files: Record<string, any>) => {
  try {
    const result: Record<string, InputFileType[]> = {};

    for (const [key, val] of Object.entries(files)) {
      if (val.mimetype === fileService.mimeType.JSON) {
        result[key] = JSON.parse(val.data.toString());
      } else if (Array.isArray(val)) {
        result[key] = val;
      } else {
        result[key] = [val];
      }
    }

    return result;
  } catch (e) {
    console.log(e);
  }
};

const validateFiles = (req: Request) => {
  try {
    let errorMessage = "";
    const {
      file: files,
      thumb: fileThumbs,
      thumbList: fileThumbList,
      fileData,
      delta,
    } = readFileAsArray(req.files as any);

    if ((!delta || !(delta as any).ops) && (!files || !files.length)) {
      errorMessage = "missing delta/file";
    }

    for (const file of files) {
      if (errorMessage) break;

      if (!fileData.find((data: any) => data.id === file.name)) {
        errorMessage = `missing data of ${file.name}`;
        break;
      }

      if (file.mineType === fileService.mimeType.VIDEO) {
        if (!fileThumbs.find((f) => f.name === file.name)) {
          errorMessage = `missing thumb of ${file.name}`;
          break;
        }
        if (!fileThumbs.find((f) => f.name === file.name)) {
          errorMessage = `missing thumb of ${file.name}`;
          break;
        }
        if (fileThumbList.filter((f) => f.name === file.name)?.length < 5) {
          errorMessage = `missing thumbnail of ${file.name}`;
          break;
        }
      }
    }

    return errorMessage;
  } catch (e) {
    console.log(e);
  }
};

const uploadMessageWithFiles: RequestHandlerCustom = async (req, res) => {
  try {
    const query: { userId?: string; teamId?: string; channelId?: string } = req.query || {};
    const { userId, teamId, channelId } = query;

    let errorMessage = "";
    if (!userId) errorMessage = "missing userId";
    if (!teamId) errorMessage = "missing teamId";
    if (!channelId) errorMessage = "missing channelId";

    const {
      file: files = [],
      thumb: fileThumbs = [],
      thumbList: fileThumbList = [],
      fileData = [],
      delta: messageDelta = {} as MessageType["delta"],
    } = readFileAsArray(req.files);

    errorMessage = validateFiles(req);

    if (errorMessage) return res.send({ error: errorMessage });
    else res.send({ ok: true, status: "uploading" });

    const mappedFileList = files.map((file) => {
      const thumbList = fileThumbList.filter((f) => f.name === file.name);
      return { id: file.name, file, thumbList };
    });

    const socketNamespace = `/${teamId}/${channelId}`;
    const io = global.io;
    const socketSpace = io.of(socketNamespace);

    let { message } = await messagesService.add({
      userId,
      teamId,
      channelId,
      delta: messageDelta as MessageType["delta"],
      files: fileData.map((f) => ({
        ...f,
        url: "",
        thumb: "",
        thumbList: [],
        status: "uploading",
      })) as any[],
      ignoreUsers: [],
      sharedMessageId: "",
    });
    socketSpace.emit(SocketEvent.ON_ADDED_MESSAGE, message);

    for (const thumbnail of fileThumbs) {
      const uploadedFile = await fileService.upload(thumbnail);
      const { id: messageFileId } = message.files.find((f) => thumbnail.name === f.uploadId);
      if (uploadedFile) {
        message = await messagesService.updateFileThumbnail(message.id, {
          fileId: messageFileId,
          thumb: uploadedFile.url,
        });

        // emit new message data
        socketSpace.emit(SocketEvent.ON_EDITED_MESSAGE, message);
      }
    }

    for (const mappedFile of mappedFileList) {
      const { file, thumbList } = mappedFile;
      const { id: messageFileId } = message.files.find((f) => mappedFile.id === f.uploadId);

      // update message url
      let uploadedFile = await fileService.upload(file);
      if (uploadedFile) {
        message = await messagesService.updateFileUrl(message.id, {
          fileId: messageFileId,
          url: uploadedFile.url,
        });

        // emit new message data
        socketSpace.emit(SocketEvent.ON_EDITED_MESSAGE, message);
      }

      // update message thumbList
      for (const thumbnail of thumbList) {
        uploadedFile = await fileService.upload(thumbnail);
        if (uploadedFile) {
          message = await messagesService.updateFileThumbList(message.id, {
            fileId: messageFileId,
            thumbList: [uploadedFile.url],
          });

          // emit new message data
          socketSpace.emit(SocketEvent.ON_EDITED_MESSAGE, message);
        }
      }

      message = await messagesService.updateFileStatus(message.id, {
        fileId: messageFileId,
        status: "done",
      });
      socketSpace.emit(SocketEvent.ON_EDITED_MESSAGE, message);
    }
  } catch (e) {
    res.send({ error: "upload failed" });
    console.log(e);
  }
};

const messageController = { uploadMessageWithFiles };

export default messageController;

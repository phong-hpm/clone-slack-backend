import { Namespace } from "socket.io";

import fileService from "@services/file.service";
import messagesService from "@services/message.service";

import { SocketEvent } from "@utils/constant";

// types
import { InputFileType } from "@services/types";
import { Request, RequestHandlerCustom } from "src/types";
import { ChannelType, MessageType } from "@database/apis/types";

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
      videos = [],
      audios = [],
      images = [],
      thumb: fileThumbs,
      thumbList: fileThumbList,
      fileData,
      delta,
    } = readFileAsArray(req.files as any);

    const files = [...videos, ...audios, ...images];

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

const emitEditMessage = (socketSpace: Namespace, channel: ChannelType, message: MessageType) => {
  // emit new message data
  socketSpace.emit(SocketEvent.ON_EDITED_MESSAGE, {
    channelId: channel.id,
    message,
    updatedTime: channel.updatedTime,
  });
};

const uploadFileAndEmitMessage = async (
  message: MessageType,
  file: InputFileType,
  type: "video" | "audio" | "image"
) => {
  const { id: messageFileId } = message.files.find((f) => file.name === f.uploadId);

  const uploadedFile = await fileService.upload({ ...file, type });
  return await messagesService.updateFileUrl(message.id, {
    fileId: messageFileId,
    url: uploadedFile.url,
    updatedTime: message.createdTime,
    ratio: uploadedFile.ratio,
  });
};

const addMessageAndEmit = async (
  socketSpace: Namespace,
  data: {
    userId: string;
    teamId: string;
    channelId: string;
    files: InputFileType[];
    delta: MessageType["delta"];
  }
) => {
  const { userId, teamId, channelId, files, delta } = data;

  const { message, channel } = await messagesService.add({
    userId,
    teamId,
    channelId,
    delta,
    files: files.map((file) => ({
      ...file,
      url: "",
      status: "uploading",
      ratio: 0.5,
    })) as any[],
    ignoreUsers: [],
    sharedMessageId: "",
  });
  socketSpace.emit(SocketEvent.ON_ADDED_MESSAGE, {
    channelId,
    message,
    updatedTime: channel.updatedTime,
  });

  return { message, channel };
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
      videos = [],
      audios = [],
      images = [],
      thumb: fileThumbs = [],
      thumbList: fileThumbList = [],
      fileData = [],
      delta: messageDelta = {} as MessageType["delta"],
    } = readFileAsArray(req.files);

    errorMessage = validateFiles(req);

    if (errorMessage) return res.send({ error: errorMessage });
    else res.send({ ok: true, status: "uploading" });

    const socketNamespace = `/${teamId}/${channelId}`;
    const io = global.io;
    const socketSpace = io.of(socketNamespace);

    // add new message
    const { message, channel } = await addMessageAndEmit(socketSpace, {
      userId,
      teamId,
      channelId,
      delta: messageDelta as MessageType["delta"],
      files: fileData,
    });

    // upload image files
    for (const imageFile of images) {
      const updatedMessage = await uploadFileAndEmitMessage(message, imageFile, "image");
      emitEditMessage(socketSpace, channel, updatedMessage);
    }

    // upload audio files
    for (const audioFile of audios) {
      const updatedMessage = await uploadFileAndEmitMessage(message, audioFile, "audio");
      emitEditMessage(socketSpace, channel, updatedMessage);
    }

    // upload video thumbs
    for (const thumbnail of fileThumbs) {
      const uploadedFile = await fileService.upload({ ...thumbnail, type: "thumb" });
      const { id: messageFileId } = message.files.find((f) => thumbnail.name === f.uploadId);
      if (uploadedFile) {
        const updatedMessage = await messagesService.updateFileThumbnail(message.id, {
          fileId: messageFileId,
          thumb: uploadedFile.url,
          updatedTime: message.createdTime,
        });

        emitEditMessage(socketSpace, channel, updatedMessage);
      }
    }

    // upload videos
    const mappedVideoFileList = videos.map((file) => {
      const thumbList = fileThumbList.filter((f) => f.name === file.name);
      return { id: file.name, file, thumbList };
    });
    for (const mappedVideoFile of mappedVideoFileList) {
      const { file, thumbList } = mappedVideoFile;

      // update message thumbList
      for (const thumbnail of thumbList) {
        const uploadedFile = await fileService.upload({ ...thumbnail, type: "thumb" });
        const { id: messageFileId } = message.files.find((f) => thumbnail.name === f.uploadId);
        if (uploadedFile) {
          await messagesService.updateFileThumbList(message.id, {
            fileId: messageFileId,
            thumbList: [uploadedFile.url],
            updatedTime: message.createdTime,
          });
        }
      }

      // update video files
      const updatedMessage = await uploadFileAndEmitMessage(message, file, "video");
      emitEditMessage(socketSpace, channel, updatedMessage);
    }
  } catch (e) {
    console.log(e);
  }
};

const messageController = { uploadMessageWithFiles };

export default messageController;

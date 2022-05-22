import * as fileServices from "../services/file.service.js";
import * as messagesServices from "../services/messages.service.js";
import { SocketEvent } from "../utils/constant.js";

const forceToArray = (files = {}) => {
  const result = {};

  for (const [key, val] of Object.entries(files)) {
    if (Array.isArray(val)) result[key] = val;
    else result[key] = [val];
  }

  return result;
};

export const uploadMessageWithFiles = async (req, res) => {
  const { userId, teamId, channelId } = req.query || {};

  let errorMessage = "";
  if (!userId) errorMessage = "missing userId";
  if (!teamId) errorMessage = "missing teamId";
  if (!channelId) errorMessage = "missing channelId";

  if (!req.files || !req.files.file) errorMessage = "missing files";
  if (!req.files || !req.files.thumb) errorMessage = "missing thumbs";
  if (!req.files || !req.files.thumbList) errorMessage = "missing thumbList";
  if (!req.files || !req.files.fileData) errorMessage = "missing file data";
  if (!req.files || !req.files.delta) errorMessage = "missing delta";

  if (errorMessage) return res.status(400).send({ error: errorMessage });
  else res.send({ status: "uploading" });

  const fileData = JSON.parse(req.files.fileData.data.toString());
  const messageDelta = JSON.parse(req.files.delta.data.toString());
  const { file: files, thumb: fileThumbs, thumbList: fileThumbList } = forceToArray(req.files);

  const mappedFileList = files.map((file) => {
    const thumbList = fileThumbList.filter((f) => f.name === file.name);
    return { id: file.name, file, thumbList };
  });

  const socketNamespace = `/${teamId}/${channelId}`;
  const io = global.io;
  const socketSpace = io.of(socketNamespace);

  let message = await messagesServices.add({
    userId,
    teamId,
    channelId,
    delta: messageDelta,
    files: fileData.map((f) => ({ ...f, url: "", thumb: "", thumbList: [], status: "uploading" })),
  });
  socketSpace.emit(SocketEvent.ON_ADDED_MESSAGE, message);

  for (const thumbnail of fileThumbs) {
    let uploadedFile = await fileServices.uploadFile(thumbnail);
    const { id: messageFileId } = message.files.find((f) => thumbnail.name === f.uploadId);
    if (uploadedFile) {
      message = await messagesServices.editFileThumbnail({
        messageId: message.id,
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

    const editFileParams = { messageId: message.id, fileId: messageFileId };

    // update message url
    let uploadedFile = await fileServices.uploadFile(file);
    if (uploadedFile) {
      message = await messagesServices.editFileUrl({
        ...editFileParams,
        url: uploadedFile.url,
      });

      // emit new message data
      socketSpace.emit(SocketEvent.ON_EDITED_MESSAGE, message);
    }

    // update message thumbList
    for (const thumbnail of thumbList) {
      uploadedFile = await fileServices.uploadFile(thumbnail);
      if (uploadedFile) {
        message = await messagesServices.editFileThumbList({
          ...editFileParams,
          thumbList: [uploadedFile.url],
        });

        // emit new message data
        socketSpace.emit(SocketEvent.ON_EDITED_MESSAGE, message);
      }
    }

    message = await messagesServices.editFileStatus({ ...editFileParams, status: "done" });
    socketSpace.emit(SocketEvent.ON_EDITED_MESSAGE, message);
  }
};

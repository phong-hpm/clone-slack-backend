import * as messagesModel from "../models/messages.model.js";
import * as channelMessagesModel from "../models/channelMessages.model.js";
import { deleteFile } from "./file.service.js";

export const getById = async (id) => {
  return await messagesModel.getMessage(id);
};

export const add = async ({ teamId, channelId, userId, delta, type = "message", files }) => {
  const message = await messagesModel.createMessage({
    delta,
    type,
    team: teamId,
    user: userId,
    files,
  });
  await channelMessagesModel.createChanelMessage(channelId, message.id);
  return message;
};

export const edit = async ({ messageId, delta }) => {
  return await messagesModel.updateMessage({ id: messageId, delta });
};

export const editFileStatus = async ({ messageId, fileId, status }) => {
  return await messagesModel.updateMessageFile({ id: messageId, fileId, status });
};

export const editFileUrl = async ({ messageId, fileId, url }) => {
  return await messagesModel.updateMessageFile({ id: messageId, fileId, url });
};

export const editFileThumbnail = async ({ messageId, fileId, thumb }) => {
  return await messagesModel.updateMessageFile({ id: messageId, fileId, thumb });
};

export const editFileThumbList = async ({ messageId, fileId, thumbList }) => {
  const message = await messagesModel.getMessage(messageId);
  const file = message.files.find((f) => f.id === fileId);
  return await messagesModel.updateMessageFile({
    id: messageId,
    fileId,
    thumbList: [...file.thumbList, ...thumbList],
  });
};

export const remove = async (channelId, messageId) => {
  const message = await messagesModel.getMessage(messageId);
  const files = message.files;
  files.forEach((file) => deleteFile(file));
  await channelMessagesModel.removeChanelMessage(channelId, messageId);
  return await messagesModel.removeMessage(messageId);
};

export const removeFile = async (messageId, fileId) => {
  const { message, file } = await messagesModel.removeMessageFile(messageId, fileId);
  if (file) deleteFile(file);

  return message;
};

export const removeAllFiles = async (messageId) => {
  const { message } = await messagesModel.removeAllMessageFiles(messageId);
  return message;
};

export const star = async (messageId) => {
  return await messagesModel.starMessage(messageId);
};

export const reaction = async (userId, messageId, reactionId) => {
  return await messagesModel.reactionMessage(userId, messageId, reactionId);
};

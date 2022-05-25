import * as messagesModel from "#models/messages.model.js";
import * as channelMessagesModel from "#models/channelMessages.model.js";
import { deleteFile } from "./file.service.js";
import { updateChannelModify, increateChannelUnreadMessageCount } from "./channels.service.js";

export const getById = async (id) => {
  return await messagesModel.getMessage(id);
};

export const add = ({ teamId, channelId, userId, delta, type = "message", files }) => {
  const message = messagesModel.createMessage({
    delta,
    type,
    team: teamId,
    user: userId,
    files,
  });
  channelMessagesModel.addMessageId(channelId, message.id);

  updateChannelModify({ id: channelId, latestModify: message.created });
  const { unreadMessageCount } = increateChannelUnreadMessageCount({
    id: channelId,
    ignoreUsers: [userId],
  });
  return { message, unreadMessageCount };
};

export const edit = (id, { delta }) => {
  return messagesModel.updateMessage(id, { delta });
};

export const editFileStatus = (id, { fileId, status }) => {
  return messagesModel.updateMessageFile(id, { fileId, status });
};

export const editFileUrl = (id, { fileId, url }) => {
  return messagesModel.updateMessageFile(id, { fileId, url });
};

export const editFileThumbnail = (id, { fileId, thumb }) => {
  return messagesModel.updateMessageFile(id, { fileId, thumb });
};

export const editFileThumbList = (id, { fileId, thumbList }) => {
  const message = messagesModel.getMessage(id);
  const file = message.files.find((f) => f.id === fileId);
  return messagesModel.updateMessageFile({
    id,
    fileId,
    thumbList: [...file.thumbList, ...thumbList],
  });
};

export const remove = (channelId, messageId) => {
  const message = messagesModel.getMessage(messageId);
  const files = message.files;
  files.forEach((file) => deleteFile(file));
  channelMessagesModel.remmoveMessageId(channelId, messageId);
  return messagesModel.removeMessage(messageId);
};

export const removeFile = (messageId, fileId) => {
  const { message, file } = messagesModel.removeMessageFile(messageId, fileId);
  if (file) deleteFile(file);

  return message;
};

export const star = (id) => {
  return messagesModel.starMessage(id);
};

export const reaction = (id, { userId, reactionId }) => {
  return messagesModel.reactionMessage(id, { userId, reactionId });
};

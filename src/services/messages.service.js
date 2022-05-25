import * as messagesModel from "#models/messages.model.js";
import * as channelMessagesModel from "#models/channelMessages.model.js";
import { deleteFile } from "./file.service.js";
import { updateChannelModify, increateChannelUnreadMessageCount } from "./channels.service.js";

export const getById = async (id) => {
  return await messagesModel.getMessage(id);
};

export const add = async ({
  teamId,
  channelId,
  userId,
  delta,
  type = "message",
  files,
  ignoreUsers = [],
}) => {
  // add new message to [messages]
  const message = await messagesModel.createMessage({
    delta,
    type,
    team: teamId,
    user: userId,
    files,
  });

  // add messageId to [channel_messages]
  await channelMessagesModel.addMessageId(channelId, message.id);

  // update modify in [channels]
  const channel = await updateChannelModify(channelId, { latestModify: message.created });

  // update unread message in [channels]
  const { unreadMessageCount } = await increateChannelUnreadMessageCount({
    id: channelId,
    ignoreUsers,
  });
  return { message, unreadMessageCount, channel };
};

export const edit = async (id, { channelId, delta }) => {
  const message = await messagesModel.updateMessage(id, { delta });

  // update modify in [channels]
  const channel = await updateChannelModify(channelId, { latestModify: message.updated });

  return { message, channel };
};

export const editFileStatus = async (id, { fileId, status }) => {
  return messagesModel.updateMessageFile(id, { fileId, status });
};

export const editFileUrl = async (id, { fileId, url }) => {
  return messagesModel.updateMessageFile(id, { fileId, url });
};

export const editFileThumbnail = async (id, { fileId, thumb }) => {
  return messagesModel.updateMessageFile(id, { fileId, thumb });
};

export const editFileThumbList = async (id, { fileId, thumbList }) => {
  const message = await messagesModel.getMessage(id);
  const file = message.files.find((f) => f.id === fileId);

  // update message file in [messages]
  return messagesModel.updateMessageFile({
    id,
    fileId,
    thumbList: [...file.thumbList, ...thumbList],
  });
};

export const remove = async (channelId, messageId) => {
  const message = await messagesModel.getMessage(messageId);
  const files = message.files;

  // delete files
  files.forEach((file) => deleteFile(file));

  // add messageId to [channel_messages]
  await channelMessagesModel.remmoveMessageId(channelId, messageId);

  // update modify in [channels]
  const channel = await updateChannelModify(channelId, { latestModify: message.updated });

  // remove message from [messages]
  await messagesModel.removeMessage(messageId);

  return { messageId, channel };
};

export const removeFile = async (messageId, fileId) => {
  const { message, file } = await messagesModel.removeMessageFile(messageId, fileId);
  if (file) deleteFile(file);

  return message;
};

export const star = async (id) => {
  return messagesModel.starMessage(id);
};

export const reaction = async (id, { userId, reactionId }) => {
  return messagesModel.reactionMessage(id, { userId, reactionId });
};

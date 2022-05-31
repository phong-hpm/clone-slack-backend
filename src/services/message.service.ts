import messageModel from "@models/message.model";
import channelMessageModel from "@models/channelMessage.model";

import fileService from "@services/file.service";
import authService from "@services/user.service";
import channelService from "@services/channel.service";

import { MessageFileType, MessageType } from "@database/apis/types";

const getById = async (id: string) => {
  return await messageModel.getById(id);
};

const add = async (data: {
  teamId: string;
  channelId: string;
  userId: string;
  delta: MessageType["delta"];
  ignoreUsers: string[];
  files?: MessageType["files"];
  sharedMessageId?: string;
}) => {
  const { teamId, channelId, userId, delta, sharedMessageId, files = [], ignoreUsers = [] } = data;

  // add new message to [messages]
  const params = { delta, sharedMessageId, team: teamId, user: userId, files };
  const message = await messageModel.insert(params);

  // add messageId to [channel_messages]
  await channelMessageModel.addMessageId(channelId, message.id);

  // update modify in [channels]
  const channel = await channelService.updateUpdatedTime(channelId, {
    updatedTime: message.updatedTime,
  });

  // update unread message in [channels]
  const { unreadMessageCount } = await channelService.increateUnread(channelId, ignoreUsers);
  return { message, unreadMessageCount, channel };
};

const share = async (data: {
  teamId: string;
  toChannelId: string;
  userId: string;
  sharedMessageId: string;
  delta?: MessageType["delta"];
  ignoreUsers?: string[];
}) => {
  const { teamId, userId, toChannelId, delta, sharedMessageId, ignoreUsers = [] } = data;

  // add new message to [messages]
  const params = { delta, sharedMessageId, team: teamId, user: userId, files: [] };
  const message = await messageModel.insert(params);

  // get [sharedMessage] from [messages]
  if (message.sharedMessageId) {
    message.sharedMessage = await messageModel.getById(message.sharedMessageId);
    (message.sharedMessage as unknown as MessageType).sharedMessageId = undefined;
    message.sharedMessageOwner = await authService.getUserInfo(message.sharedMessage.user);
  }

  // add messageId to [channel_messages]
  await channelMessageModel.addMessageId(toChannelId, message.id);

  // update modify in [channels]
  const channel = await channelService.updateUpdatedTime(toChannelId, {
    updatedTime: message.updatedTime,
  });

  // update unread message in [channels]
  const { unreadMessageCount } = await channelService.increateUnread(toChannelId, [
    ...ignoreUsers,
    userId,
  ]);
  return { message, unreadMessageCount, channel };
};

const editDelta = async (
  id: string,
  { channelId, delta }: { channelId: string; delta?: MessageType["delta"] }
) => {
  const message = await messageModel.updateDelta(id, { delta });
  // update modify in [channels]
  const channel = await channelService.updateUpdatedTime(channelId, {
    updatedTime: message.updatedTime,
  });

  return { message, channel };
};

const editStar = async (id: string, { channelId }: { channelId: string }) => {
  const message = await messageModel.updateStar(id);
  // update modify in [channels]
  const channel = await channelService.updateUpdatedTime(channelId, {
    updatedTime: message.updatedTime,
  });
  return { message, channel };
};

const editReaction = async (
  id: string,
  { channelId, userId, reactionId }: { channelId: string; userId: string; reactionId: string }
) => {
  const message = await messageModel.updateReaction(id, { userId, reactionId });
  // update modify in [channels]
  const channel = await channelService.updateUpdatedTime(channelId, {
    updatedTime: message.updatedTime,
  });
  return { message, channel };
};

const remove = async (id: string, { channelId }: { channelId: string }) => {
  const message = await messageModel.getById(id);
  const files = message.files || [];

  // delete files
  files.forEach((file) => fileService.remove(file));

  // add messageId to [channel_messages]
  await channelMessageModel.remmoveMessageId(channelId, id);

  // update modify in [channels]
  const channel = await channelService.updateUpdatedTime(channelId, { updatedTime: Date.now() });

  // remove message from [messages]
  await messageModel.remove(id);

  return { messageId: id, channel };
};

const removeFile = async (
  id: string,
  { channelId, fileId }: { channelId: string; fileId: string }
) => {
  const { message, file } = await messageModel.removeFile(id, fileId);
  if (file) fileService.remove(file);

  // update modify in [channels]
  const channel = await channelService.updateUpdatedTime(channelId, {
    updatedTime: message.updatedTime,
  });

  return { message, channel };
};

const updateFileStatus = async (
  id: string,
  { fileId, status }: { fileId: string; status: MessageFileType["status"] }
) => {
  return messageModel.updateFile(id, { fileId, status });
};

const updateFileUrl = async (id: string, { fileId, url }: { fileId: string; url: string }) => {
  return messageModel.updateFile(id, { fileId, url });
};

const updateFileThumbnail = async (
  id: string,
  { fileId, thumb }: { fileId: string; thumb: string }
) => {
  return messageModel.updateFile(id, { fileId, thumb });
};

const updateFileThumbList = async (
  id: string,
  { fileId, thumbList }: { fileId: string; thumbList: string[] }
) => {
  const message = await messageModel.getById(id);
  const file = message.files.find((f) => f.id === fileId);

  // update message file in [messages]
  return messageModel.updateFile(id, {
    fileId,
    thumbList: [...file.thumbList, ...thumbList],
  });
};

const messageService = {
  updateFileUrl,
  updateFileThumbList,
  updateFileThumbnail,
  updateFileStatus,
  removeFile,
  remove,
  editReaction,
  editStar,
  editDelta,
  share,
  add,
  getById,
};

export default messageService;

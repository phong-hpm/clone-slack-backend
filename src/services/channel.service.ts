import channelModel from "@models/channel.model";
import channelMessagesModel from "@models/channelMessage.model";

import userService from "@services/user.service";
import messagesService from "@services/message.service";

import { ChannelType, MessageType } from "@database/apis/types";
import { ChannelViewType, MessageViewType } from "@services/types";

const getChannelMessages = async (messageIds: string[] = []) => {
  const messages: MessageViewType[] = [];
  for (let i = 0; i < messageIds.length; i++) {
    const message = await messagesService.getById(messageIds[i]);
    if (message) {
      if (message.sharedMessageId) {
        message.sharedMessage = await messagesService.getById(message.sharedMessageId);
        (message.sharedMessage as unknown as MessageType).sharedMessageId = undefined;
      }
      messages.push(message as unknown as MessageViewType);
    }
  }
  return messages;
};

export const getById = async (id: string) => {
  return channelModel.getById(id);
};

const find = async (searchObj: Partial<ChannelType>) => {
  return channelModel.find(searchObj);
};

export const getHistory = async (id: string) => {
  const messageIds = await channelMessagesModel.getById(id);
  const channel = await channelModel.getById(id);
  const messages = await getChannelMessages(messageIds);
  return { messages, updatedTime: channel.updatedTime };
};

const getView = async (id: string, userId: string) => {
  const channel = await channelModel.getById(id);

  // logged user is not in this channel
  if (!channel.users.includes(userId)) return null;

  (channel as unknown as ChannelViewType).unreadMessageCount =
    channel.unreadMessageCount[userId] || 0;

  if (channel.type === "direct_message") {
    if (channel.users.includes(userId)) {
      // direct channel only has 2 users
      const parterId = channel.users.find((id) => id !== userId);
      const parter = await userService.getUserView(parterId);
      channel.name = parter.name;
      channel.partner = parter;
    } else {
      // direct message of another users
      return null;
    }
  }

  return channel;
};

const add = async (data: Partial<ChannelType> & { userId?: string; teamId: string }) => {
  return channelModel.create(data);
};

const updateUpdatedTime = async (id: string, data: { updatedTime: number }) => {
  return channelModel.update(id, data);
};

const increateUnread = async (id: string, ignoreUsers?: string[]) => {
  return channelModel.increateUnread(id, ignoreUsers);
};

const clearUnreadMessageCount = async (id: string, users?: string[]) => {
  return channelModel.clearUnread(id, users);
};

const channelService = {
  getById,
  find,
  getView,
  getHistory,
  add,
  increateUnread,
  updateUpdatedTime,
  clearUnreadMessageCount,
};

export default channelService;

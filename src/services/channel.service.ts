import channelModel from "@models/channel.model";
import channelMessagesModel from "@models/channelMessage.model";

import userService from "@services/user.service";
import messagesService from "@services/message.service";

import { ChannelType, MessageType } from "@database/apis/types";
import { ChannelViewType, MessageViewType } from "@services/types";

// return list of [MessageView] which descending sorted by [createdTime]
const getChannelMessagesDESC = async (messageIds: string[] = []) => {
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
  return messages.sort((a, b) => b.createdTime - a.createdTime);
};

export const getById = async (id: string) => {
  return channelModel.getById(id);
};

const find = async (searchObj: Partial<ChannelType>) => {
  return channelModel.find(searchObj);
};

const update = channelModel.update;

export const getHistory = async (
  id: string,
  { limit, beforeTime }: { limit: number; beforeTime?: number }
) => {
  const messageIds = await channelMessagesModel.getById(id);
  const channel = await channelModel.getById(id);
  // DESC sorted by createdTime
  const allMessagesDESC = await getChannelMessagesDESC(messageIds);

  let startIndex = 0;
  if (beforeTime) {
    startIndex = allMessagesDESC.findIndex(({ createdTime }) => createdTime === beforeTime) + 1;
  }

  // there are no more messages left
  if (startIndex < 0)
    return {
      messages: [],
      updatedTime: channel.updatedTime,
      loadedFromTime: beforeTime,
      hasMore: false,
    };

  const messagesDESC: MessageType[] = [];
  for (let i = startIndex; i < startIndex + limit; i++) {
    if (allMessagesDESC[i]) messagesDESC.push(allMessagesDESC[i]);
  }

  const messages = [...messagesDESC].reverse();

  return {
    messages,
    updatedTime: channel.updatedTime,
    loadedFromTime: messages[0]?.createdTime || 0,
    hasMore: allMessagesDESC.length > startIndex + limit,
  };
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

const addUsersToChannel = async (id: string, data: { userIds: string[] }) => {
  return channelModel.addUsers(id, data);
};

const removeUserFromChannel = async (id: string, userId: { userId: string }) => {
  return channelModel.removeUser(id, userId);
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
  update,
  getView,
  getHistory,
  add,
  addUsersToChannel,
  removeUserFromChannel,
  increateUnread,
  updateUpdatedTime,
  clearUnreadMessageCount,
};

export default channelService;

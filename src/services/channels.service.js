import * as channelsModel from "../models/channels.model.js";
import * as channelMessagesModel from "../models/channelMessages.model.js";

import * as authServices from "./auth.service.js";
import * as messagesServices from "./messages.service.js";

export const getChanel = async (id) => {
  return channelsModel.getChanel(id);
};

const getChanelMessages = async (messageIds = []) => {
  const messages = [];
  for (let i = 0; i < messageIds.length; i++) {
    const message = await messagesServices.getById(messageIds[i]);
    if (message) messages.push(message);
  }
  return messages;
};

export const getChanelHistory = async (id) => {
  const messageIds = await channelMessagesModel.getChanelMessages(id);
  return await getChanelMessages(messageIds);
};

export const getChanelView = async (id, userId, options = {}) => {
  const channel = await channelsModel.getChanel(id);

  channel.unreadMessageCount = channel.unreadMessageCount[userId] || 0;

  if (channel.type === "direct_message") {
    if (channel.users.includes(userId)) {
      // direct channel only has 2 users
      const anotherUserId = channel.users.find((id) => id !== userId);
      const anotherUser = await authServices.getUserView(anotherUserId);
      channel.name = anotherUser.name;
    } else {
      // direct message of another users
      return null;
    }
  }

  if (channel && options.isDeep) {
    if (options.messages) {
      if (options.messages.isDeep) {
        channel.messages = await getChanelHistory(channel.id, options.messages);
      }
    }

    if (options.users && options.users.isDeep) {
      const users = [];
      for (let i = 0; i < channel.users.length; i++) {
        const user = await authServices.getUserView(channel.users[i], options.users);
        if (user) users.push(user);
      }

      channel.users = users;
    }
  }

  return channel;
};

export const updateChannelModify = ({ id, latestModify }) => {
  return channelsModel.updateChanel({ id, latestModify });
};

export const increateChannelUnreadMessageCount = ({ id, ignoreUsers }) => {
  return channelsModel.increateUnread({ id, ignoreUsers });
};

export const clearChannelUnreadMessageCount = ({ id, users }) => {
  return channelsModel.clearUnread({ id, users });
};

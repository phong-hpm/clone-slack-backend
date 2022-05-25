import * as channelsModel from "#models/channels.model.js";
import * as channelMessagesModel from "#models/channelMessages.model.js";

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

export const getChanelView = async (id, userId) => {
  const channel = await channelsModel.getChanel(id);

  // logged user is not in this channel
  if (!channel.users.includes(userId)) return null;

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

  return channel;
};

export const addChannel = ({ teamId, userId, name, desc }) => {
  return channelsModel.createChannel({ teamId, userId, name, desc });
};

export const updateChannelModify = ({ id, latestModify }) => {
  return channelsModel.updateChannel(id, { latestModify });
};

export const increateChannelUnreadMessageCount = ({ id, ignoreUsers }) => {
  return channelsModel.increateUnread({ id, ignoreUsers });
};

export const clearChannelUnreadMessageCount = ({ id, users }) => {
  return channelsModel.clearUnread({ id, users });
};

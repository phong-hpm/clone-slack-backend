import * as channelsModel from "#models/channels.model.js";
import * as channelMessagesModel from "#models/channelMessages.model.js";

import * as authServices from "./auth.service.js";
import * as messagesServices from "./messages.service.js";

export const getChannel = async (id) => {
  return channelsModel.getChannelById(id);
};

const getChannelMessages = async (messageIds = []) => {
  const messages = [];
  for (let i = 0; i < messageIds.length; i++) {
    const message = await messagesServices.getById(messageIds[i]);
    if (message) messages.push(message);
  }
  return messages;
};

export const getChannelHistory = async (id) => {
  const messageIds = await channelMessagesModel.getChannelMessages(id);
  const channel = await channelsModel.getChannelById(id);
  const messages = await getChannelMessages(messageIds);
  return { messages, latestModify: channel.latestModify };
};

export const getChannelView = async (id, userId) => {
  const channel = await getChannel(id);

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

export const addChannel = async ({ teamId, userId, name, desc }) => {
  return channelsModel.createChannel({ teamId, userId, name, desc });
};

export const updateChannelModify = async (id, { latestModify }) => {
  return channelsModel.updateChannel(id, { latestModify });
};

export const increateChannelUnreadMessageCount = async ({ id, ignoreUsers }) => {
  return channelsModel.increateUnread({ id, ignoreUsers });
};

export const clearChannelUnreadMessageCount = async ({ id, users }) => {
  return channelsModel.clearUnread({ id, users });
};

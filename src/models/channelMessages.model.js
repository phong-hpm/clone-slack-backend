import { getTable, writeData } from "../database/index.js";

export const getChanelMessages = async (channelId) => {
  try {
    const channelMessages = await getTable("channel_messages");
    return channelMessages[channelId] || [];
  } catch {
    return null;
  }
};

export const createChanelMessage = async (channelId, messageId) => {
  try {
    const channelMessages = await getTable("channel_messages");
    if (!channelMessages[channelId]) channelMessages[channelId] = [];
    channelMessages[channelId].push(messageId);
    await writeData();
    return messageId;
  } catch (e) {
    return null;
  }
};

export const removeChanelMessage = async (channelId, messageId) => {
  try {
    const channelMessages = await getTable("channel_messages");
    if (!channelMessages[channelId]) return null;
    channelMessages[channelId] = channelMessages[channelId].filter((mesId) => mesId !== messageId);
    await writeData();
    return messageId;
  } catch (e) {
    return null;
  }
};

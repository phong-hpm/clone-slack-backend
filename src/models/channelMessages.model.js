import { channelMessagesTable } from "#database/apis/index.js";

export const getChannelMessages = async (channelId) => {
  return channelMessagesTable.readById(channelId);
};

export const addMessageId = async (channelId, messageId) => {
  return channelMessagesTable.update(channelId, [messageId]);
};

export const remmoveMessageId = async (channelId, messageId) => {
  const channelMessage = await channelMessagesTable.readById(channelId);
  const data = channelMessage.filter((id) => id !== messageId);

  // delete old data first
  await channelMessagesTable.remove(channelId);
  // insert new data back
  return channelMessagesTable.insert(channelId, data);
};

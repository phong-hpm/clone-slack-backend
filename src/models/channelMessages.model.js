import { channelMessagesTable } from "#database/apis/index.js";

export const getChanelMessages = (channelId) => {
  return channelMessagesTable.readById(channelId);
};

export const addMessageId = (channelId, messageId) => {
  return channelMessagesTable.update(channelId, [messageId]);
};

export const remmoveMessageId = (channelId, messageId) => {
  const channelMessage = channelMessagesTable.readById(channelId);
  const data = channelMessage.filter((id) => id !== messageId);

  // delete old data first
  channelMessagesTable.remove(channelId);
  // insert new data back
  return channelMessagesTable.insert(channelId, data);
};

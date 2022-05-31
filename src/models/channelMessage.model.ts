import { channelMessagesTable } from "@database/apis";

const getById = async (channelId: string) => {
  return channelMessagesTable.readById(channelId);
};

const addMessageId = async (channelId: string, messageId: string) => {
  return channelMessagesTable.update(channelId, [messageId]);
};

const remmoveMessageId = async (channelId: string, messageId: string) => {
  const channelMessage = await channelMessagesTable.readById(channelId);
  const data = channelMessage.filter((id) => id !== messageId);

  // delete old data first
  await channelMessagesTable.remove(channelId);
  // insert new data back
  return channelMessagesTable.insert(channelId, data);
};

const channelMessageModel = { getById, addMessageId, remmoveMessageId };

export default channelMessageModel;

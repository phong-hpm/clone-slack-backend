import { getTable, writeData } from "../database/index.js";

export const getChanelMessages = async (chanelId) => {
  try {
    const chanelMessages = await getTable("chanel_messages");
    return chanelMessages[chanelId] || [];
  } catch {
    return null;
  }
};

export const createChanelMessage = async (chanelId, messageId) => {
  try {
    const chanelMessages = await getTable("chanel_messages");
    chanelMessages[chanelId].push(messageId);
    await writeData();
    return messageId;
  } catch (e) {
    return null;
  }
};

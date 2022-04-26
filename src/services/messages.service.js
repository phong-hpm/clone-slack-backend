import * as messagesModel from "../models/messages.model.js";
import * as channelMessagesModel from "../models/channelMessages.model.js";

export const getById = async (id) => {
  return await messagesModel.getMessage(id);
};

export const getHistory = async (limit) => {
  const messages = await messagesModel.getMessages(limit);
  return messages;
};

export const add = async ({ teamId, channelId, userId, text, type = "message" }) => {
  const message = await messagesModel.createMessage({ text, type, team: teamId, user: userId });
  await channelMessagesModel.createChanelMessage(channelId, message.id);
  return message;
};

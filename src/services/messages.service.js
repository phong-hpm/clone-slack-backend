import * as messagesModel from "../models/messages.model.js";
import * as chanelMessagesModel from "../models/chanelMessages.model.js";

export const getById = async (id) => {
  return await messagesModel.getMessage(id);
};

export const getHistory = async (limit) => {
  const messages = await messagesModel.getMessages(limit);
  return messages;
};

export const add = async ({ teamId, chanelId, userId, text, type = "message" }) => {
  const message = await messagesModel.createMessage({ text, type, team: teamId, user: userId });
  await chanelMessagesModel.createChanelMessage(chanelId, message.id);
  return message;
};

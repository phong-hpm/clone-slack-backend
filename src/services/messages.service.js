import * as messagesModel from "../models/messages.model.js";

export const getById = async (id) => {
  return await messagesModel.getMessage(id);
};

export const getHistory = async (limit) => {
  const messages = await messagesModel.getMessages(limit);
  return messages;
};

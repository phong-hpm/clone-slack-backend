import * as messagesModel from "../models/messages.model.js";
import * as channelMessagesModel from "../models/channelMessages.model.js";

export const getById = async (id) => {
  return await messagesModel.getMessage(id);
};

export const add = async ({ teamId, channelId, userId, delta, type = "message" }) => {
  const message = await messagesModel.createMessage({ delta, type, team: teamId, user: userId });
  await channelMessagesModel.createChanelMessage(channelId, message.id);
  return message;
};

export const edit = async ({ messageId, delta }) => {
  return await messagesModel.updateMessage({ id: messageId, delta });
};

export const remove = async (messageId) => {
  return await messagesModel.removeMessage(messageId);
};

export const star = async (messageId) => {
  return await messagesModel.starMessage(messageId);
};

export const reaction = async (userId, messageId, reactionId) => {
  return await messagesModel.reactionMessage(userId, messageId, reactionId);
};

import * as chanelsModel from "../models/chanels.model.js";
import * as chanelMessagesModel from "../models/chanelMessages.model.js";

import * as authServices from "./auth.service.js";
import * as messagesServices from "./messages.service.js";

const getChanelMessages = async (messageIds = []) => {
  const messages = [];
  for (let i = 0; i < messageIds.length; i++) {
    const message = await messagesServices.getById(messageIds[i]);
    if (message) messages.push(message);
  }
  return messages;
};

export const getChanelHistory = async (id, options) => {
  const messageIds = await chanelMessagesModel.getChanelMessages(id);
  return await getChanelMessages(messageIds);
};

export const getChanelView = async (id, userId, options = {}) => {
  const chanel = await chanelsModel.getChanel(id);

  if (chanel.type === "direct_message") {
    if (chanel.users.includes(userId)) {
      // direct chanel only has 2 users
      const anotherUserId = chanel.users.find((id) => id !== userId);
      const anotherUser = await authServices.getUserView(anotherUserId);
      chanel.name = anotherUser.name;
    } else {
      // direct message of another users
      return null;
    }
  }

  if (chanel && options.isDeep) {
    if (options.messages) {
      if (options.messages.isDeep) {
        console.log(chanel);
        chanel.messages = await getChanelHistory(chanel.id, options.messages);
      }
    }

    if (options.users && options.users.isDeep) {
      const users = [];
      for (let i = 0; i < chanel.users.length; i++) {
        const user = await authServices.getUserView(chanel.users[i], options.users);
        if (user) users.push(user);
      }

      chanel.users = users;
    }
  }

  return chanel;
};

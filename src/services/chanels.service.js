import * as chanelsModel from "../models/chanels.model.js";
import * as authServices from "./auth.service.js";
import * as messagesServices from "./messages.service.js";

export const getChanelView = async (id, options = {}) => {
  const chanel = await chanelsModel.getChanel(id);

  if (chanel && options.isDeep) {
    if (options.messages) {
      if (options.messages.isRemove) {
        delete chanel.messages;
      } else if (options.messages.isDeep) {
        const messages = [];
        const max = Math.min(options.messages.limit, chanel.messages.length);
        for (let i = 0; i < max; i++) {
          const user = await messagesServices.getById(chanel.messages[i], options.messages);
          if (user) messages.push(user);
        }
        chanel.messages = messages;
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

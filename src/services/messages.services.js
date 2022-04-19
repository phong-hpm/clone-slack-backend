import { getChanelById, updateChanelById } from "./chanels.service.js";

export const updateMessages = (chanelId, callback) => {
  return updateChanelById(chanelId, (chanel) => callback(chanel.data.messages));
};

export const getMessages = async (chanelId) => {
  const chanel = await getChanelById(chanelId);
  return chanel.data.messages;
};

export const getMessageById = async (chanelId, id) => {
  const chanel = await getChanelById(chanelId);
  return chanel.data.messages[id];
};

export const addMessage = (chanelId, value) => {
  return updateMessages(chanelId, (messages) => {
    const lastId = (messages.lastId || 0) + 1;
    messages[lastId] = {
      id: lastId,
      data: {
        value,
        createdDate: new Date(),
        reply: null,
        reactions: {},
      },
      user: {},
    };
    messages.lastId = lastId;
    return messages[lastId];
  });
};

export const updateMessageById = async (chanelId, id, value) => {
  const message = await getMessageById(chanelId, id);
  if (!message) return { error: "message id doesn't exist" };

  return updateMessages(chanelId, (messages) => {
    messages[id].data.value = value;
    return messages[id];
  });
};

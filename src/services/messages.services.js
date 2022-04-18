import { getRoomById, updateRoomById } from "./rooms.service.js";

export const updateMessages = (roomId, callback) => {
  return updateRoomById(roomId, (room) => callback(room.data.messages));
};

export const getMessages = async (roomId) => {
  const room = await getRoomById(roomId);
  return room.messages;
};

export const getMessageById = async (roomId, id) => {
  const room = await getRoomById(roomId);
  return room.data.messages[id];
};

export const addMessage = (roomId, value) => {
  return updateMessages(roomId, (messages) => {
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

export const updateMessageById = async (roomId, id, value) => {
  const message = await getMessageById(roomId, id);
  if (!message) return { error: "message id doesn't exist" };

  return updateMessages(roomId, (messages) => {
    messages[id].data.value = value;
    return messages[id];
  });
};

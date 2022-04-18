import { db, getData, updateData } from "../database/index.js";

export const getRooms = () => getData((data) => data.rooms);
export const getRoomById = (id) => getData((data) => data.rooms[id]);

export const updateRooms = (callback) => {
  return updateData((data) => callback(data.rooms));
};

export const addRoom = () => {
  return updateRooms((rooms) => {
    const lastId = (rooms.lastId || 0) + 1;

    rooms[lastId] = {
      id: lastId,
      data: {
        users: [],
        messages: { lastId: 1 },
      },
    };
    rooms.lastId = lastId;

    return rooms[lastId];
  });
};

export const updateRoomById = async (id, callback) => {
  const room = await getRoomById(id);
  if (!room) return { error: "room id doesn't exist" };

  return updateRooms((rooms) => callback(rooms[id]));
};

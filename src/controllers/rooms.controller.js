import * as services from "../services/rooms.service.js";

export const getAll = async (req, res) => {
  const rooms = await services.getRooms();
  res.send(rooms);
};

export const add = async (req, res) => {
  const newRoom = await services.addRoom();
  res.send(newRoom);
};

export const getById = async (req, res) => {
  const { roomId } = req.params;
  const room = await services.getRoomById(roomId);
  res.send(room);
};

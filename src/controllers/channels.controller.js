import * as services from "../services/channels.service.js";

export const getAll = async (req, res) => {
  const channels = await services.getChanels();
  res.send(channels);
};

export const add = async (req, res) => {
  const newChanel = await services.addChanel();
  res.send(newChanel);
};

export const getById = async (req, res) => {
  const { channelId } = req.params;
  const channel = await services.getChanelById(channelId);
  res.send(channel);
};

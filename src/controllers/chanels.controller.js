import * as services from "../services/chanels.service.js";

export const getAll = async (req, res) => {
  const chanels = await services.getChanels();
  res.send(chanels);
};

export const add = async (req, res) => {
  const newChanel = await services.addChanel();
  res.send(newChanel);
};

export const getById = async (req, res) => {
  const { chanelId } = req.params;
  const chanel = await services.getChanelById(chanelId);
  res.send(chanel);
};

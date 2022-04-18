import * as services from "../services/messages.services.js";

export const getAll = async (req, res) => {
  const { roomId } = req.params;
  const messages = await services.getMessages(roomId);
  res.send(messages);
};

export const add = async (req, res) => {
  const { roomId } = req.params;
  const { postData } = req.body;
  const message = await services.addMessage(roomId, postData);
  res.send(message);
};

export const getById = async (req, res) => {
  const { roomId, messageId } = req.params;
  const message = await services.getMessageById(roomId, messageId);
  res.send(message);
};

export const updateById = async (req, res) => {
  const { roomId, messageId } = req.params;
  const { postData } = req.body;
  const { error, message } = await services.updateMessageById(roomId, messageId, postData);

  if (error) res.status(400).send(error);

  res.send(message);
};

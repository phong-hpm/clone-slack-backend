import * as services from "../services/messages.service.js";

export const getAll = async (req, res) => {
  const { chanelId } = req.params;
  const messages = await services.getMessages(chanelId);
  res.send(messages);
};

export const add = async (req, res) => {
  const { chanelId } = req.params;
  const { postData } = req.body;
  const message = await services.addMessage(chanelId, postData);
  res.send(message);
};

export const getById = async (req, res) => {
  const { chanelId, messageId } = req.params;
  const message = await services.getMessageById(chanelId, messageId);
  res.send(message);
};

export const updateById = async (req, res) => {
  const { chanelId, messageId } = req.params;
  const { postData } = req.body;
  const { error, message } = await services.updateMessageById(chanelId, messageId, postData);

  if (error) res.status(400).send(error);

  res.send(message);
};

import * as services from "../services/messages.service.js";

export const add = async (req, res) => {
  const { channelId } = req.params;
  const { postData } = req.body;
  const message = await services.addMessage(channelId, postData);
  res.send(message);
};

export const getById = async (req, res) => {
  const { channelId, messageId } = req.params;
  const message = await services.getMessageById(channelId, messageId);
  res.send(message);
};

export const updateById = async (req, res) => {
  const { channelId, messageId } = req.params;
  const { postData } = req.body;
  const { error, message } = await services.updateMessageById(channelId, messageId, postData);

  if (error) res.status(400).send(error);

  res.send(message);
};

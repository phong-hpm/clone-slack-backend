import { getTable, writeData } from "../database/index.js";
import { generateId } from "../utils/generateId.js";

// functions
const getRawMessage = async (id) => {
  try {
    const messages = await getTable("messages");
    return messages[id];
  } catch {
    return null;
  }
};

// services
const getIndexMessage = async (id) => {
  const messages = await getTable("messages");
  let index = -1;
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].id === id) {
      index = i;
      break;
    }
  }
  return index;
};

export const getMessage = async (id) => {
  try {
    const message = await getRawMessage(id);
    message.reactions = [...Object.values(message.reactions)];
    return message;
  } catch {
    return null;
  }
};

export const getMessages = async (id) => {
  try {
    const messages = await getTable("messages");
    return messages[id];
  } catch {
    return null;
  }
};

export const createMessage = async ({ delta, team, user, type }) => {
  try {
    const id = `M-${generateId()}`;
    const messages = await getTable("messages");
    messages[id] = {
      id,
      delta,
      type,
      created: Date.now(),
      user,
      team,
      reactions: {},
    };
    await writeData();
    return getMessage(id);
  } catch (e) {
    return null;
  }
};

export const updateMessage = async ({ id, delta }) => {
  const message = await getRawMessage(id);
  if (!message) return null;
  message.delta = delta;
  message.isEdited = true;
  await writeData();
  return getMessage(id);
};

export const removeMessage = async (id) => {
  const messages = await getTable("messages");
  let index = getIndexMessage(id);
  if (index < 0) return null;
  delete messages[index];
  await writeData();
  return id;
};

export const starMessage = async (id) => {
  const message = await getRawMessage(id);
  if (!message) return null;
  message.isStared = !message.isStared;
  await writeData();
  return getMessage(id);
};

export const reactionMessage = async (userId, messageId, reactionId) => {
  const message = await getRawMessage(messageId);
  if (!message) return null;
  if (!message.reactions[reactionId])
    message.reactions[reactionId] = { id: reactionId, users: [], count: 0 };

  const currentReaction = message.reactions[reactionId];
  if (currentReaction.users.find((user) => user === userId)) {
    currentReaction.users = currentReaction.users.filter((user) => user !== userId);
  } else {
    currentReaction.users.push(userId);
  }

  currentReaction.count = currentReaction.users.length;
  if (!currentReaction.count) delete message.reactions[reactionId];

  await writeData();
  return getMessage(messageId);
};

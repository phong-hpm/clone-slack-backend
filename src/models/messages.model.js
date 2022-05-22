import { getTable, writeData } from "../database/index.js";
import { generateId } from "../utils/generateId.js";

const getDataById = (list, id) => {
  let index = -1;
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      index = i;
      break;
    }
  }
  return index;
};

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

export const createMessage = async ({ delta, team, user, type, files }) => {
  try {
    const id = `M-${generateId()}`;
    const messages = await getTable("messages");
    const messageFiles = files.map((file) => ({
      ...file,
      uploadId: file.id,
      id: `F-${generateId()}`,
    }));

    messages[id] = {
      id,
      delta,
      type,
      created: Date.now(),
      user,
      team,
      reactions: {},
      files: messageFiles,
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

export const updateMessageFile = async ({ id, fileId, url, thumb, thumbList, status }) => {
  const message = await getRawMessage(id);
  if (!message) return null;
  const file = message.files.find((f) => f.id === fileId);
  if (!file) return null;
  if (url) file.url = url;
  if (thumb) file.thumb = thumb;
  if (thumbList) file.thumbList = thumbList;
  if (status) file.status = status;
  await writeData();
  return getMessage(id);
};

export const removeMessage = async (id) => {
  const messages = await getTable("messages");
  delete messages[id];
  await writeData();
  return { id };
};

export const removeAllMessageFiles = async (id) => {
  const message = await getRawMessage(id);
  if (!message) return null;
  message.files = [];

  if (!message.delta.ops) return removeMessage(message.id);

  await writeData();
  return { message };
};

export const removeMessageFile = async (id, fileId) => {
  const message = await getRawMessage(id);
  if (!message) return null;
  const file = message.files.find((file) => file.id === fileId);
  if (file) {
    message.files = message.files.filter((file) => file.id !== fileId);
    await writeData();
  }
  return { message: getMessage(id), file };
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

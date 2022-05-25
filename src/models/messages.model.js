import { messagesTable } from "#database/apis/index.js";
import { generateId } from "#utils/generateId.js";

// functions
const getRawMessage = async (id) => {
  return messagesTable.readById(id);
};

// services
export const getMessage = async (id) => {
  const message = await getRawMessage(id);
  message.reactions = [...Object.values(message.reactions)];
  return message;
};

export const createMessage = async ({ delta, team, user, type, files }) => {
  const id = `M-${generateId()}`;
  const messageFiles = (files || []).map((file) => ({
    ...file,
    uploadId: file.id,
    id: `F-${generateId()}`,
  }));

  const now = Date.now();

  return messagesTable.insert(id, {
    id,
    delta,
    type,
    user,
    team,
    reactions: {},
    files: messageFiles,
    created: now,
    updated: now,
  });
};

export const updateMessage = async (id, { delta }) => {
  return messagesTable.update(id, {
    delta,
    isEdited: true,
    updated: Date.now(),
  });
};

export const updateMessageFile = async (id, { fileId, url, thumb, thumbList, status }) => {
  const message = await messagesTable.readById(id);
  const fileList = message.files;
  const file = fileList.find((f) => f.id === fileId);

  if (url) file.url = url;
  if (thumb) file.thumb = thumb;
  if (thumbList) file.thumbList = thumbList;
  if (status) file.status = status;

  return messagesTable.update(id, { files: fileList });
};

export const removeMessage = async (id) => {
  await messagesTable.remove(id);
  return id;
};

export const removeMessageFile = async (id, fileId) => {
  const message = await messagesTable.readById(id);
  const fileList = message.files.filter((file) => file.id !== fileId);
  const removedFile = message.files.find((file) => file.id === fileId);

  const updatedMessage = await messagesTable.update(id, { files: fileList });

  return { message: updatedMessage, file: removedFile };
};

export const starMessage = async (id) => {
  const message = await messagesTable.readById(id);
  return messagesTable.update(id, { isStared: !message.isStared });
};

export const reactionMessage = async (id, { userId, reactionId }) => {
  const message = await messagesTable.readById(id);
  const reactions = message.reactions;
  if (!reactions[reactionId]) {
    reactions[reactionId] = { id: reactionId, users: [], count: 0 };
  }

  const currentReaction = reactions[reactionId];
  if (currentReaction.users.find((user) => user === userId)) {
    currentReaction.users = currentReaction.users.filter((user) => user !== userId);
  } else {
    currentReaction.users.push(userId);
  }

  currentReaction.count = currentReaction.users.length;
  if (!currentReaction.count) delete reactions[reactionId];

  await messagesTable.update(id, { reactions });
  // this method will map [reactions] to array
  return getMessage(id);
};

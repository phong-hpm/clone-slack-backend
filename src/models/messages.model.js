import { messagesTable } from "#database/apis/index.js";
import { generateId } from "#utils/generateId.js";

// functions
const getRawMessage = (id) => {
  return messagesTable.readById(id);
};

// services
export const getMessage = (id) => {
  const message = getRawMessage(id);
  message.reactions = [...Object.values(message.reactions)];
  return message;
};

export const createMessage = ({ delta, team, user, type, files }) => {
  const id = `M-${generateId()}`;
  const messageFiles = (files || []).map((file) => ({
    ...file,
    uploadId: file.id,
    id: `F-${generateId()}`,
  }));

  return messagesTable.insert(id, {
    id,
    delta,
    type,
    created: Date.now(),
    user,
    team,
    reactions: {},
    files: messageFiles,
  });
};

export const updateMessage = (id, { delta }) => {
  return messagesTable.update(id, {
    delta,
    isEdited: true,
  });
};

export const updateMessageFile = (id, { fileId, url, thumb, thumbList, status }) => {
  const message = messagesTable.readById(id);
  const fileList = message.files;
  const file = fileList.find((f) => f.id === fileId);

  if (url) file.url = url;
  if (thumb) file.thumb = thumb;
  if (thumbList) file.thumbList = thumbList;
  if (status) file.status = status;

  return messagesTable.update(id, { files: fileList });
};

export const removeMessage = (id) => {
  messagesTable.remove(id);
  return id;
};

export const removeMessageFile = (id, fileId) => {
  const message = messagesTable.readById(id);
  const fileList = message.files.filter((file) => file.id !== fileId);
  const removedFile = message.files.find((file) => file.id === fileId);

  const updatedMessage = messagesTable.update(id, { files: fileList });

  return { message: updatedMessage, file: removedFile };
};

export const starMessage = (id) => {
  const message = messagesTable.readById(id);
  return messagesTable.update(id, { isStared: !message.isStared });
};

export const reactionMessage = (id, { userId, reactionId }) => {
  const message = messagesTable.readById(id);
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

  messagesTable.update(id, { reactions });
  console.log(id);
  // this method will map [reactions] to array
  return getMessage(id);
};

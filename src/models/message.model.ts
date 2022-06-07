import { messagesTable } from "@database/apis";
import { MessageFileType, MessageType } from "@database/apis/types";
import { generateId } from "@utils/generateId";

// services
const getById = async (id: string) => {
  return messagesTable.readById(id);
};

const insert = async (data: Partial<MessageType>) => {
  const { delta, sharedMessageId, team, user, type, files } = data;
  const id = `M-${generateId()}`;
  const messageFiles = (files || []).map((file) => {
    return { ...file, uploadId: file.id, id: `F-${generateId()}` };
  });

  return messagesTable.insert(id, {
    id,
    delta,
    type,
    user,
    team,
    reactions: {},
    files: messageFiles,
    sharedMessageId,
  });
};

const updateDelta = async (id: string, { delta }: { delta: MessageType["delta"] }) => {
  return messagesTable.update(id, { delta, isEdited: true });
};

const updateStarred = async (id: string) => {
  const message = await messagesTable.readById(id);
  return messagesTable.update(id, { isStarred: !message.isStarred });
};

const updateReaction = async (
  id: string,
  { userId, reactionId }: { userId: string; reactionId: string }
) => {
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
  return messagesTable.readById(id);
};

const updateFile = async (id: string, data: Partial<MessageFileType> & { fileId: string }) => {
  const { fileId, url, thumb, thumbList, status } = data;
  const message = await messagesTable.readById(id);
  const fileList = message.files;
  const file = fileList.find((f) => f.id === fileId);

  if (url) file.url = url;
  if (thumb) file.thumb = thumb;
  if (thumbList) file.thumbList = thumbList;
  if (status) file.status = status;

  return messagesTable.update(id, { files: fileList });
};

const remove = async (id: string) => {
  await messagesTable.remove(id);
  return id;
};

const removeFile = async (id: string, fileId: string) => {
  const message = await messagesTable.readById(id);
  const fileList = message.files.filter((file) => file.id !== fileId);
  const removedFile = message.files.find((file) => file.id === fileId);

  const updatedMessage = await messagesTable.update(id, { files: fileList });

  return { message: updatedMessage, file: removedFile };
};

const messageModel = {
  getById,
  insert,
  updateDelta,
  updateStarred,
  updateReaction,
  updateFile,
  remove,
  removeFile,
};

export default messageModel;

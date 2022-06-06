import { channelMessagesTable, channelsTable, teamsTable } from "@database/apis";
import { ChannelType } from "@database/apis/types";

import { generateId } from "@utils/generateId";

const getById = async (id: string) => {
  return channelsTable.readById(id);
};

const find = async (searchObj: Partial<ChannelType>) => {
  return channelsTable.find(searchObj);
};

const create = async (data: Partial<ChannelType> & { userId?: string; teamId: string }) => {
  const { teamId, type, userId, name, desc = "", users, avatar } = data;
  if (!userId || (!name && type !== "group_message")) return null;
  const team = await teamsTable.readById(teamId);

  const channelId = type === "group_message" ? `G-${generateId()}` : `C-${generateId()}`;
  const userList = type === "group_message" ? [userId, ...users] : [...team.users];
  const unreadMessageCount = {};

  userList.forEach((user) => (unreadMessageCount[user] = 0));

  // create channel
  const channel = await channelsTable.insert(channelId, {
    id: channelId,
    type,
    name,
    desc,
    users: userList,
    unreadMessageCount,
    creator: userId,
    team: teamId,
    avatar,
  });

  // add [channelId] to [team.channels]
  const teamChannels = [...team.channels, channelId];
  await teamsTable.update(teamId, { channels: teamChannels });

  // init data [channelMessages]
  await channelMessagesTable.insert(channelId, []);

  return channel;
};

const update = async (id: string, data: Partial<ChannelType>) => {
  return channelsTable.update(id, data);
};

const addUsers = async (id: string, { userIds }: { userIds: string[] }) => {
  let channel = await channelModel.getById(id);
  const messageIds = await channelMessagesTable.readById(id);

  const userListSet = new Set(channel.users);
  const unreadMessageCount = { ...channel.unreadMessageCount };

  userIds.forEach((userId) => {
    userListSet.add(userId);
    if (!unreadMessageCount[userId]) unreadMessageCount[userId] = messageIds.length;
  });
  channel = await channelModel.update(id, { users: [...userListSet.values()], unreadMessageCount });

  return channel;
};

const removeUser = async (id: string, { userId }: { userId: string }) => {
  let channel = await channelModel.getById(id);

  const unreadMessageCount = { ...channel.unreadMessageCount };
  delete unreadMessageCount[userId];

  channel = await channelModel.update(id, {
    users: channel.users.filter((user) => user !== userId),
    unreadMessageCount,
  });

  return channel;
};

const increateUnread = async (id: string, ignoreUsers: string[] = []) => {
  const channel = await channelsTable.readById(id);
  const unreadMessageCount = { ...channel.unreadMessageCount };

  for (const [id] of Object.entries(unreadMessageCount)) {
    if (ignoreUsers.includes(id)) continue;
    unreadMessageCount[id]++;
  }

  const updatedChannel = await channelsTable.update(id, {
    unreadMessageCount,
    // don't update updatedTime when increate Unread time
    updatedTime: channel.updatedTime,
  });
  return {
    channel: updatedChannel,
    unreadMessageCount: updatedChannel.unreadMessageCount,
  };
};

const clearUnread = async (id: string, users: string[] = []) => {
  const channel = await channelsTable.readById(id);
  if (!users.length) return {};
  const unreadMessageCount = { ...channel.unreadMessageCount };

  users.forEach((userId) => {
    // user not existed in channel
    if (unreadMessageCount[userId] === undefined) return;
    unreadMessageCount[userId] = 0;
  });

  const updatedChannel = await channelsTable.update(id, {
    unreadMessageCount,
    // don't update updatedTime when clear Unread time
    updatedTime: channel.updatedTime,
  });
  return {
    channel: updatedChannel,
    unreadMessageCount: updatedChannel.unreadMessageCount,
  };
};

const channelModel = {
  getById,
  find,
  create,
  update,
  addUsers,
  removeUser,
  increateUnread,
  clearUnread,
};

export default channelModel;

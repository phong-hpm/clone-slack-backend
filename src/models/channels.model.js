import { channelMessagesTable, channelsTable, teamsTable } from "#database/apis/index.js";

import { generateId } from "#utils/generateId.js";

export const getChannelById = async (id) => {
  return channelsTable.readById(id);
};

export const createChannel = async ({ teamId, userId, name, desc = "" }) => {
  if (!userId || !name) return null;

  let team = await teamsTable.readById(teamId);

  const unreadMessageCount = {};
  // map [unreadMessageCount] from [teamUSers]
  team.users.forEach((user) => (unreadMessageCount[user] = 0));

  // create channel
  const channelId = `C-${generateId()}`;
  const newChannel = await channelsTable.insert(channelId, {
    id: channelId,
    type: "channel",
    name,
    desc,
    users: team.users,
    unreadMessageCount,
    creator: userId,
  });

  // add [channelId] to [team.channels]
  const teamChannels = [...team.channels, channelId];
  await teamsTable.update(teamId, { channels: teamChannels });

  // init data [channelMessages]
  await channelMessagesTable.insert(channelId, []);

  return newChannel;
};

export const updateChannel = async (id, data) => {
  return channelsTable.update(id, data);
};

export const increateUnread = async ({ id, ignoreUsers = [] }) => {
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

export const clearUnread = async ({ id, users = [] }) => {
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

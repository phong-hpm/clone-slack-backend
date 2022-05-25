import { channelMessagesTable, channelsTable, teamsTable } from "#database/apis/index.js";

import { generateId } from "#utils/generateId.js";

export const getChanel = (id) => {
  return channelsTable.readById(id);
};

export const createChannel = ({ teamId, userId, name, desc = "" }) => {
  if (!teamId || !userId || !name) return null;

  let team = teamsTable.readById(teamId);

  const unreadMessageCount = {};
  // map [unreadMessageCount] from [teamUSers]
  team.users.forEach((user) => (unreadMessageCount[user] = 0));

  // create channel
  const channelId = `C-${generateId()}`;
  channelsTable.insert(channelId, {
    id: channelId,
    type: "channel",
    name,
    desc,
    users: team.users,
    unreadMessageCount,
    creator: userId,
    created: Date.now(),
    latestModify: 0,
  });

  // add [channelId] to [team.channels]
  team = teamsTable.readById(teamId);
  const teamChannels = [...team.channels, channelId];
  teamsTable.update(teamId, { channels: teamChannels });

  // init data [channelMessages]
  channelMessagesTable.insert(channelId, []);

  return getChanel(channelId);
};

export const updateChannel = (id, data) => {
  return channelsTable.update(id, data);
};

export const increateUnread = ({ id, ignoreUsers = [] }) => {
  const channel = channelsTable.readById(id);
  const unreadMessageCount = { ...channel.unreadMessageCount };

  for (const [id] of Object.entries(unreadMessageCount)) {
    if (ignoreUsers.includes(id)) continue;
    unreadMessageCount[id]++;
  }

  const updatedChannel = channelsTable.update(id, { unreadMessageCount });
  return {
    channel: updatedChannel,
    unreadMessageCount: updatedChannel.unreadMessageCount,
  };
};

export const clearUnread = ({ id, users = [] }) => {
  const channel = channelsTable.readById(id);
  if (!users.length) return {};
  const unreadMessageCount = { ...channel.unreadMessageCount };

  users.forEach((userId) => {
    // user not existed in channel
    if (unreadMessageCount[userId] === undefined) return;
    unreadMessageCount[userId] = 0;
  });

  const updatedChannel = channelsTable.update(id, { unreadMessageCount });
  return {
    channel: updatedChannel,
    unreadMessageCount: updatedChannel.unreadMessageCount,
  };
};

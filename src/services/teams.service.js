import { getChannelView } from "#services/channels.service.js";

import { getTeamById } from "#models/teams.model.js";
import { getUserView } from "#models/user.model.js";

export const getTeamView = async (id, userId, options) => {
  const team = await getTeamById(id);

  if (team && options.isDeep) {
    if (options.channels && options.channels.isDeep) {
      const channels = [];
      for (let i = 0; i < team.channels.length; i++) {
        const channelView = await getChannelView(team.channels[i], userId, options.channels);
        // when logged user is not in this channel
        if (channelView) channels.push(channelView);
      }

      team.channels = channels;
    }

    if (options.users && options.users.isDeep) {
      const users = [];
      for (let i = 0; i < team.users.length; i++) {
        const channelView = await getUserView(team.users[i], options.users);
        if (channelView) users.push(channelView);
      }

      team.users = users;
    }
  }

  return team;
};

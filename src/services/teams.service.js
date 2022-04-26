import * as channelsServices from "./channels.service.js";
import * as authServices from "./auth.service.js";
import * as teamsModel from "../models/teams.model.js";

export const getTeamView = async (id, userId, options) => {
  const team = await teamsModel.getTeam(id);

  if (team && options.isDeep) {
    if (options.channels && options.channels.isDeep) {
      const channels = [];
      for (let i = 0; i < team.channels.length; i++) {
        const channelView = await channelsServices.getChanelView(
          team.channels[i],
          userId,
          options.channels
        );
        if (channelView) channels.push(channelView);
      }

      team.channels = channels;
    }

    if (options.users && options.users.isDeep) {
      const users = [];
      for (let i = 0; i < team.users.length; i++) {
        const channelView = await authServices.getUserView(team.users[i], options.users);
        if (channelView) users.push(channelView);
      }

      team.users = users;
    }
  }

  return team;
};

import * as chanelsServices from "./chanels.service.js";
import * as authServices from "./auth.service.js";
import * as teamsModel from "../models/teams.model.js";

export const getTeamView = async (id, options) => {
  const team = await teamsModel.getTeam(id);

  if (team && options.isDeep) {
    if (options.chanels && options.chanels.isDeep) {
      const chanels = [];
      for (let i = 0; i < team.chanels.length; i++) {
        const chanelView = await chanelsServices.getChanelView(team.chanels[i], options.chanels);
        if (chanelView) chanels.push(chanelView);
      }

      team.chanels = chanels;
    }

    if (options.users && options.users.isDeep) {
      const users = [];
      for (let i = 0; i < team.users.length; i++) {
        const chanelView = await authServices.getUserView(team.users[i], options.users);
        if (chanelView) users.push(chanelView);
      }

      team.users = users;
    }
  }

  return team;
};

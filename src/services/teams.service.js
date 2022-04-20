import * as chanelsServices from "./chanels.service.js";
import * as teamsModel from "../models/teams.model.js";

export const getTeamView = async (id) => {
  const teamView = await teamsModel.getTeam(id);

  if (teamView) {
    const chanels = [];
    for (let i = 0; i < teamView.chanels.length; i++) {
      const chanelView = await chanelsServices.getChanelView(teamView.chanels[i]);
      if (chanelView) chanels.push(chanelView);
    }

    teamView.chanels = chanels;
  }

  return teamView;
};

import userModel from "@models/user.model";
import teamModl from "@models/team.model";

import channelService from "@services/channel.service";

import { ChannelType, UserInfoType } from "@database/apis/types";
import { TeamViewType } from "@services/types";

export const getById = async (id: string) => {
  return await teamModl.getById(id);
};

const getView = async (id: string, userId: string) => {
  const team = await teamModl.getById(id);

  const channels: ChannelType[] = [];
  for (let i = 0; i < team.channels.length; i++) {
    const channelView = await channelService.getView(team.channels[i], userId);
    // when logged user is not in this channel
    if (channelView) channels.push(channelView);
  }

  (team as unknown as TeamViewType).channels = channels;

  const users: UserInfoType[] = [];
  for (let i = 0; i < team.users.length; i++) {
    const userView = await userModel.getUserInfo(team.users[i]);
    if (userView) users.push(userView);
  }

  (team as unknown as TeamViewType).users = users;

  return team as unknown as TeamViewType;
};

const teamService = { getById, getView };

export default teamService;

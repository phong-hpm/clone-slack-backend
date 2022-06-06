import { IoTeamData } from "@socket/spaces/team.space";

import { SocketEvent } from "@utils/constant";

import { ChannelType } from "@database/apis/types";

const emitEditedChannelUpdatedTime = (ioTeamData: IoTeamData) => (channel: ChannelType) => {
  const eventName = SocketEvent.ON_EDITED_CHANNEL_UPDATED_TIME;
  const data = { channelId: channel.id, updatedTime: channel.updatedTime };
  // emit to users of this channel, who is online
  const teamSocketIdList = ioTeamData.getSocketIdListByUserIdList(channel.users);
  io._nsps.get(ioTeamData.spaceName)?.to(teamSocketIdList).emit(eventName, data);
};

export default emitEditedChannelUpdatedTime;

import { IoTeamData } from "@socket/spaces/team.space";

import { SocketEvent } from "@utils/constant";

import { ChannelType } from "@database/apis/types";

const emitAddedChannel = (ioTeamData: IoTeamData) => (channel: ChannelType) => {
  const { spaceName } = ioTeamData;
  const socketIdList = ioTeamData.getSocketIdListByUserIdList(channel.users);
  io.of(spaceName).to(socketIdList).emit(SocketEvent.ON_ADDED_CHANNEL, { channel });
};

export default emitAddedChannel;

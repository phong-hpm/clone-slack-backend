import { IoTeamData } from "@socket/spaces/team.space";

import { SocketEvent } from "@utils/constant";

import { ChannelType } from "@database/apis/types";

const emitEditedChannel = (ioTeamData: IoTeamData) => (channel: ChannelType) => {
  const { spaceName } = ioTeamData;
  // loop in all users of this [channelId]
  const socketIdList = ioTeamData.getSocketIdListByUserIdList(channel.users);
  io.of(spaceName).to(socketIdList).emit(SocketEvent.ON_EDITED_CHANNEL, { channel });
};

export default emitEditedChannel;

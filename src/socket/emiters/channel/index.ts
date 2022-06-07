import { IoTeamData } from "@socket/spaces/team.space";

import emitAddedChannel from "./emitAddedChannel";
import emitEditedChannel from "./emitEditedChannel";
import emitEditedChannelUnread from "./emitEditedChannelUnread";
import emitEditedChannelUpdatedTime from "./emitEditedChannelUpdatedTime";

const setupChannelEmiter = (ioChannelData: IoTeamData) => {
  return {
    emitAddedChannel: emitAddedChannel(ioChannelData),
    emitEditedChannel: emitEditedChannel(ioChannelData),
    emitEditedChannelUnread: emitEditedChannelUnread(ioChannelData),
    emitEditedChannelUpdatedTime: emitEditedChannelUpdatedTime(ioChannelData),
  };
};

export default setupChannelEmiter;

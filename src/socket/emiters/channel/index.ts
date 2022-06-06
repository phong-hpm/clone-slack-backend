import { IoTeamData } from "@socket/spaces/team.space";

import emitEditedChannelUpdatedTime from "./emitEditedChannelUpdatedTime";
import emitEditedChannelUnread from "./emitEditedChannelUnread";

const setupChannelEmiter = (ioChannelData: IoTeamData) => {
  return {
    emitEditedChannelUpdatedTime: emitEditedChannelUpdatedTime(ioChannelData),
    emitEditedChannelUnread: emitEditedChannelUnread(ioChannelData),
  };
};

export default setupChannelEmiter;

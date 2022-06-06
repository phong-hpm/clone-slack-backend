import { IoTeamData } from "@socket/spaces/team.space";

import { SocketEvent } from "@utils/constant";

const emitEditedChannelUnread =
  (ioTeamData: IoTeamData) =>
  (id: string, userIds: string[], unreadMessageCount: Record<string, number>) => {
    // loop in all users of this [channelId]
    for (const userId of userIds) {
      io._nsps
        .get(ioTeamData.spaceName)
        ?.to(ioTeamData.getSocketId(userId))
        .emit(SocketEvent.ON_EDITED_CHANNEL_UNREAD_MESSAGE_COUNT, {
          channelId: id,
          unreadMessageCount: unreadMessageCount[userId],
        });
    }
  };

export default emitEditedChannelUnread;

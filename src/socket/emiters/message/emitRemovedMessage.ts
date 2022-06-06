import { IoChannelData } from "@socket/spaces/messages.space";

import { SocketEvent } from "@utils/constant";
import { ChannelType } from "@database/apis/types";

const emitRemovedMessage =
  (ioChannelData: IoChannelData) => async (messageId: string, channel: ChannelType) => {
    const { spaceName, channelId } = ioChannelData;
    io._nsps.get(spaceName)?.emit(SocketEvent.ON_REMOVED_MESSAGE, {
      channelId,
      messageId,
      updatedTime: channel.updatedTime,
    });

    return { messageId, channel };
  };

export default emitRemovedMessage;

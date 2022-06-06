import { IoChannelData } from "@socket/spaces/messages.space";

import { SocketEvent } from "@utils/constant";

import { ChannelType, MessageType } from "@database/apis/types";

const emitAddedMessage =
  (ioChannelData: IoChannelData) => async (message: MessageType, channel: ChannelType) => {
    const { channelId } = ioChannelData;

    const emitData = { channelId, message, updatedTime: channel.updatedTime };
    io._nsps.get(ioChannelData.spaceName)?.emit(SocketEvent.ON_ADDED_MESSAGE, emitData);
  };

export default emitAddedMessage;

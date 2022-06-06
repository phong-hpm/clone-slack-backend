import { IoChannelData } from "@socket/spaces/messages.space";

import { SocketEvent } from "@utils/constant";

import { ChannelType, MessageType } from "@database/apis/types";

const emitEditedMessage =
  (ioChannelData: IoChannelData) => (channel: ChannelType, message: MessageType) => {
    const data = { channelId: channel.id, message, updatedTime: channel.updatedTime };
    io._nsps.get(ioChannelData.spaceName)?.emit(SocketEvent.ON_EDITED_MESSAGE, data);
  };

export default emitEditedMessage;

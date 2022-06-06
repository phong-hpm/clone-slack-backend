import { IoChannelData } from "@socket/spaces/messages.space";

import { SocketEvent } from "@utils/constant";
import { MessageType } from "@database/apis/types";

const emitLoadMessage =
  (ioChannelData: IoChannelData) =>
  async (data: {
    updatedTime: number;
    messages: MessageType[];
    loadedFromTime: number;
    hasMore: boolean;
  }) => {
    const { updatedTime, messages, loadedFromTime, hasMore } = data;
    const { socket, channelId } = ioChannelData;
    ioChannelData.setChannelMessageData({ loadedFromTime, hasMore });

    socket.emit(SocketEvent.ON_MESSAGES, { channelId, messages, updatedTime, hasMore });
  };

export default emitLoadMessage;

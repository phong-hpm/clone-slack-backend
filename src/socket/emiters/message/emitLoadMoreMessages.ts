import { IoChannelData } from "@socket/spaces/messages.space";

import { SocketEvent } from "@utils/constant";
import { MessageType } from "@database/apis/types";

const emitLoadMoreMessages =
  (ioChannelData: IoChannelData) =>
  async (data: { messages: MessageType[]; hasMore: boolean; loadedFromTime: number }) => {
    const { messages, hasMore, loadedFromTime } = data;
    // save message data to ioMessage instances
    ioChannelData.setChannelMessageData({ loadedFromTime, hasMore });

    ioChannelData.socket.emit(SocketEvent.ON_MORE_MESSAGES, { messages, hasMore });
  };

export default emitLoadMoreMessages;

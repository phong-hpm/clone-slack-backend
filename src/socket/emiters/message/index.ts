import { IoChannelData } from "@socket/spaces/messages.space";

import emitAddedMessage from "./emitAddedMessage";
import emitEditedMessage from "./emitEditedMessage";
import emitRemovedMessage from "./emitRemovedMessage";
import emitLoadMessage from "./emitLoadMessage";
import emitLoadMoreMessages from "./emitLoadMoreMessages";

const setupMessageEmiter = (ioChannelData: IoChannelData) => {
  return {
    emitAddedMessage: emitAddedMessage(ioChannelData),
    emitEditedMessage: emitEditedMessage(ioChannelData),
    emitRemovedMessage: emitRemovedMessage(ioChannelData),
    emitLoadMessage: emitLoadMessage(ioChannelData),
    emitLoadMoreMessages: emitLoadMoreMessages(ioChannelData),
  };
};

export default setupMessageEmiter;

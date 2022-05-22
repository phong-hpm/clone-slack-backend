import { channelIdRegExp } from "../../utils/generateId.js";

import * as channelsServices from "../../services/channels.service.js";
import * as messagesServices from "../../services/messages.service.js";
import { SocketEvent, SocketEventDefault } from "../../utils/constant.js";

const channelSocketHandler = () => {
  const io = global.io;
  const space = io.of(channelIdRegExp);

  space.on(SocketEventDefault.CONNECTION, (socket) => {
    const namespace = socket.nsp;
    const [teamId, channelId] = namespace.name.replace("/", "").split("/");
    socket.teamId = teamId;
    socket.channelId = channelId;

    socket.on(SocketEvent.EMIT_LOAD_MESSAGES, (payload) => {
      const { limit = 2 } = payload;

      const options = {
        isDeep: true,
        limit,
      };

      channelsServices.getChanelHistory(channelId, options).then((res) => {
        setTimeout(() => {
          socket.emit(SocketEvent.ON_MESSAGES, res);
        }, 0);
      });
    });

    // emit new message
    socket.on(SocketEvent.EMIT_ADD_MESSAGE, (payload) => {
      const { data } = payload;
      messagesServices
        .add({ teamId, channelId, userId: socket.userId, delta: data.delta })
        .then((res) => {
          io.of(namespace.name).emit(SocketEvent.ON_ADDED_MESSAGE, res);
        });
    });

    // emit edit message
    socket.on(SocketEvent.EMIT_EDIT_MESSAGE, (payload) => {
      const { data } = payload;
      messagesServices.edit({ messageId: data.id, delta: data.delta }).then((res) => {
        if (!res) return;
        io.of(namespace.name).emit(SocketEvent.ON_EDITED_MESSAGE, res);
      });
    });

    // emit remove message
    socket.on(SocketEvent.EMIT_REMOVE_MESSAGE, (payload) => {
      const { data } = payload;
      messagesServices.remove(channelId, data.id).then((res) => {
        if (!res || !res.id) return;
        io.of(namespace.name).emit(SocketEvent.ON_REMOVED_MESSAGE, res.id);
      });
    });

    // emit remove message file
    socket.on(SocketEvent.EMIT_REMOVE_MESSAGE_FILE, (payload) => {
      const { data } = payload;
      messagesServices.removeFile(data.id, data.fileId).then((res) => {
        if (!res) return;
        io.of(namespace.name).emit(SocketEvent.ON_REMOVED_MESSAGE_FILE, res);
      });
    });

    // emit start message
    socket.on(SocketEvent.EMIT_STAR_MESSAGE, (payload) => {
      const { data } = payload;
      messagesServices.star(data.id).then((res) => {
        if (!res) return;
        io.of(namespace.name).emit(SocketEvent.ON_EDITED_MESSAGE, res);
      });
    });

    // emit reaction message
    socket.on(SocketEvent.EMIT_REACTION_MESSAGE, (payload) => {
      const { data } = payload;
      messagesServices.reaction(socket.userId, data.id, data.reactionId).then((res) => {
        if (!res) return;
        io.of(namespace.name).emit(SocketEvent.ON_EDITED_MESSAGE, res);
      });
    });
  });

  return space;
};

export default channelSocketHandler;

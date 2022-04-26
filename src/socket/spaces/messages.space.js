import { channelIdRegExp } from "../../utils/generateId.js";

import * as channelsServices from "../../services/channels.service.js";
import * as messagesServices from "../../services/messages.service.js";
import { SocketEvent, SocketEventDefault } from "../../utils/constant.js";

const channelSocketHandler = (io) => {
  const space = io.of(channelIdRegExp);

  space.on(SocketEventDefault.CONNECTION, (socket) => {
    const namespace = socket.nsp;
    const [teamId, channelId] = namespace.name.replace("/", "").split("/");
    // fetch existing users
    const users = [];
    for (let [id, socket] of io.of(namespace.name).sockets) {
      users.push({ sId: id, name: socket.name, email: socket.email });
    }
    socket.emit("users", users);

    socket.on(SocketEvent.EMIT_ADD_MESSAGE, (payload) => {
      const { userId, data } = payload;
      messagesServices.add({ teamId, channelId, userId, text: data.text }).then((res) => {
        io.of(namespace.name).emit(SocketEvent.ON_NEW_MESSAGE, res);
      });
    });

    socket.on(SocketEvent.EMIT_LOAD_MESSAGES, (payload) => {
      const { limit = 2 } = payload;

      const options = {
        isDeep: true,
        limit,
      };

      channelsServices.getChanelHistory(channelId, options).then((res) => {
        socket.emit(SocketEvent.ON_MESSAGES, res);
      });
    });
  });

  return space;
};

export default channelSocketHandler;

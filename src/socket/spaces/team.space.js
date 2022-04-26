import { teamIdRegExp } from "../../utils/generateId.js";

import * as teamsServices from "../../services/teams.service.js";
import { SocketEvent, SocketEventDefault } from "../../utils/constant.js";

const teamSocketHandler = (io) => {
  const space = io.of(teamIdRegExp);

  space.on(SocketEventDefault.CONNECTION, (socket) => {
    const namespace = socket.nsp;
    const teamId = namespace.name.replace("/", "");

    socket.on(SocketEvent.EMIT_ADD_CHANNEL, (payload) => {
      console.log(SocketEvent.EMIT_ADD_CHANNEL, payload);
    });

    socket.on(SocketEvent.EMIT_LOAD_CHANNELS, ({ userId }) => {
      const options = {
        isDeep: true,
        channels: {
          isDeep: true,
          messages: {
            isDeep: false,
            isRemove: true,
          },
          users: {
            isDeep: false,
          },
        },
        users: {
          isDeep: true,
          teams: {
            isRemove: true,
          },
        },
      };
      teamsServices.getTeamView(teamId, userId, options).then((res) => {
        socket.emit(SocketEvent.ON_CHANNELS, res);
      });
    });
  });

  return space;
};

export default teamSocketHandler;

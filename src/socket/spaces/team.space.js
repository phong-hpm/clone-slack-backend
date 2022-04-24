import { teamIdRegExp } from "../../utils/generateId.js";

import * as teamsServices from "../../services/teams.service.js";
import { SocketEvent, SocketEventDefault } from "../../utils/constant.js";

const teamSocketHandler = (io) => {
  const space = io.of(teamIdRegExp);

  space.on(SocketEventDefault.CONNECTION, (socket) => {
    const namespace = socket.nsp;
    const teamId = namespace.name.replace("/", "");

    socket.on(SocketEvent.EMIT_ADD_CHANEL, (payload) => {});

    socket.on(SocketEvent.EMIT_LOAD_CHANELS, ({ userId }) => {
      const options = {
        isDeep: true,
        chanels: {
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
        socket.emit(SocketEvent.ON_CHANELS, res);
      });
    });
  });

  return space;
};

export default teamSocketHandler;

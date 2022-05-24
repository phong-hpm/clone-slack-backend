//
import { clearChannelUnreadMessageCount } from "../../services/channels.service.js";
import * as teamsServices from "../../services/teams.service.js";

// utils
import { teamIdRegExp } from "../../utils/generateId.js";
import { SocketEvent, SocketEventDefault } from "../../utils/constant.js";

const teamSocketHandler = () => {
  const io = global.io;
  const ioTeams = io.teams;
  const workspace = io.of(teamIdRegExp);

  workspace.on(SocketEventDefault.CONNECTION, (socket) => {
    const namespace = socket.nsp;
    const teamId = namespace.name.slice(1);

    if (!ioTeams[`/${teamId}`]) {
      ioTeams[`/${teamId}`] = { channels: {}, userSocketIds: {} };
    }

    const teamUserSocketIds = ioTeams[`/${teamId}`].userSocketIds;
    teamUserSocketIds[socket.userId] = socket.id;

    // on users online
    socket.broadcast.emit(SocketEvent.ON_USER_ONLINE, socket.userId);

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
        const users = res.users.map((user) => ({
          ...user,
          isOnline: !!teamUserSocketIds[user.id],
        }));
        socket.emit(SocketEvent.ON_CHANNELS, { ...res, users });
      });
    });

    socket.on(SocketEvent.EMIT_RESET_CHANNEL_UNREAD_MESSAGE_COUNT, async ({ channelId }) => {
      await clearChannelUnreadMessageCount({ id: channelId, users: [socket.userId] });
      socket.emit(SocketEvent.ON_EDITED_CHANNEL_UNREAD_MESSAGE_COUNT, channelId, 0);
    });

    socket.on(SocketEventDefault.DISCONNECT, () => {
      delete teamUserSocketIds[socket.userId];
    });
  });

  return workspace;
};

export default teamSocketHandler;

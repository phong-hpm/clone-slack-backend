//
import {
  clearChannelUnreadMessageCount,
  addChannel,
  getChannelView,
} from "#services/channels.service.js";
import * as teamsServices from "#services/teams.service.js";

// utils
import { teamIdRegExp } from "#utils/generateId.js";
import { SocketEvent, SocketEventDefault } from "#utils/constant.js";

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

    socket.on(SocketEvent.EMIT_ADD_CHANNEL, async (payload) => {
      try {
        const { data } = payload;
        const channel = await addChannel({
          teamId,
          userId: socket.userId,
          name: data.name,
          desc: data.desc,
        });
        const channelView = await getChannelView(channel.id, socket.userId);

        // emit to users of this channel only
        channel.users.forEach((user) => {
          if (!teamUserSocketIds[user]) return;
          console.log("user", user);
          io.of(namespace.name)
            .to(teamUserSocketIds[user])
            .emit(SocketEvent.ON_ADDED_CHANNEL, channelView);
        });
      } catch (e) {
        console.log(e);
      }
    });

    socket.on(SocketEvent.EMIT_LOAD_CHANNELS, async ({ userId }) => {
      try {
        const options = {
          isDeep: true,
          channels: {
            isDeep: true,
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

        const teamView = await teamsServices.getTeamView(teamId, userId, options);

        const users = teamView.users.map((user) => ({
          ...user,
          isOnline: !!teamUserSocketIds[user.id],
        }));
        socket.emit(SocketEvent.ON_CHANNELS, { ...teamView, users });
      } catch (e) {
        console.log(e);
      }
    });

    socket.on(SocketEvent.EMIT_RESET_CHANNEL_UNREAD_MESSAGE_COUNT, async ({ channelId }) => {
      try {
        await clearChannelUnreadMessageCount({ id: channelId, users: [socket.userId] });
        socket.emit(SocketEvent.ON_EDITED_CHANNEL_UNREAD_MESSAGE_COUNT, channelId, 0);
      } catch (e) {
        console.log(e);
      }
    });

    socket.on(SocketEventDefault.DISCONNECT, () => {
      delete teamUserSocketIds[socket.userId];
    });
  });

  return workspace;
};

export default teamSocketHandler;

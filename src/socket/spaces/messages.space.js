import { getChannelHistory, clearChannelUnreadMessageCount } from "#services/channels.service.js";
import * as messagesServices from "#services/messages.service.js";

import { channelIdRegExp } from "#utils/generateId.js";
import { SocketEvent, SocketEventDefault } from "#utils/constant.js";

const channelSocketHandler = () => {
  const io = global.io;
  const workspace = io.of(channelIdRegExp);

  workspace.on(SocketEventDefault.CONNECTION, (socket) => {
    const namespace = socket.nsp;
    const [teamId, channelId] = namespace.name.slice(1).split("/");
    socket.teamId = teamId;
    socket.channelId = channelId;

    if (!io.teams[`/${teamId}`]) {
      io.teams[`/${teamId}`] = { channels: {}, userSocketIds: {} };
    }

    const ioCurrentTeam = io.teams[`/${teamId}`];

    if (!ioCurrentTeam[`/${channelId}`]) {
      ioCurrentTeam[`/${channelId}`] = { userSocketIds: {} };
    }

    const teamUserSocketIds = ioCurrentTeam.userSocketIds;
    const channelUserSocketIds = ioCurrentTeam[`/${channelId}`].userSocketIds;
    channelUserSocketIds[socket.userId] = socket.id;

    console.log(channelUserSocketIds);

    socket.on(SocketEvent.EMIT_LOAD_MESSAGES, async (payload) => {
      try {
        const { limit = 2 } = payload;

        const options = {
          isDeep: true,
          limit,
        };

        const { messages, latestModify } = await getChannelHistory(channelId, options);
        socket.emit(SocketEvent.ON_MESSAGES, { channelId, messages, latestModify });

        // clear [unreadMessageCount] for this [userId] in [channelId]
        await clearChannelUnreadMessageCount({ id: channelId, users: [socket.userId] });
        io.of(`/${teamId}`)
          .to(teamUserSocketIds[socket.userId])
          .emit(SocketEvent.ON_EDITED_CHANNEL_UNREAD_MESSAGE_COUNT, channelId, 0);
      } catch (e) {
        console.log(e);
      }
    });

    // emit new message
    socket.on(SocketEvent.EMIT_ADD_MESSAGE, async (payload) => {
      try {
        const { data } = payload;

        // add new message
        const addParams = {
          teamId,
          channelId,
          userId: socket.userId,
          delta: data.delta,
          ignoreUsers: Object.keys(channelUserSocketIds), // they are reading this [channelId]
        };
        const { message, unreadMessageCount, channel } = await messagesServices.add(addParams);

        // emit new messages added to all connected users
        io.of(namespace.name).emit(SocketEvent.ON_ADDED_MESSAGE, {
          channelId,
          message,
          latestModify: channel.latestModify,
        });

        // loop in all users of this [channelId]
        for (const userId of channel.users) {
          // send to user who is online
          if (!teamUserSocketIds[userId]) continue;

          // send [channel.latestModify] to all users of this [channelId]
          io.of(`/${teamId}`)
            .to(teamUserSocketIds[userId])
            .emit(SocketEvent.ON_EDITED_CHANNEL_LATEST_MOFIDY, channelId, channel.latestModify);

          // send [channel.unreadMessageCount] to all users of this [channelId]
          //    who haven't connected to because they are NOT reading this channel
          if (!channelUserSocketIds[userId]) {
            io.of(`/${teamId}`)
              .to(teamUserSocketIds[userId])
              .emit(
                SocketEvent.ON_EDITED_CHANNEL_UNREAD_MESSAGE_COUNT,
                channelId,
                unreadMessageCount[userId]
              );
          }
        }
      } catch (e) {
        console.log(e);
      }
    });

    // emit edit message
    socket.on(SocketEvent.EMIT_EDIT_MESSAGE, async (payload) => {
      try {
        const { data } = payload;
        const { message, channel } = await messagesServices.edit(data.id, {
          channelId,
          delta: data.delta,
        });
        io.of(namespace.name).emit(SocketEvent.ON_EDITED_MESSAGE, {
          channelId,
          message,
          latestModify: channel.latestModify,
        });

        // loop in all users of this [channelId]
        for (const userId of channel.users) {
          // send to user who is online
          if (!teamUserSocketIds[userId]) continue;

          // send [channel.latestModify] to all users of this [channelId]
          io.of(`/${teamId}`)
            .to(teamUserSocketIds[userId])
            .emit(SocketEvent.ON_EDITED_CHANNEL_LATEST_MOFIDY, channelId, channel.latestModify);
        }
      } catch (e) {
        console.log(e);
      }
    });

    // emit remove message
    socket.on(SocketEvent.EMIT_REMOVE_MESSAGE, async (payload) => {
      try {
        const { data } = payload;
        const { messageId, channel } = await messagesServices.remove(channelId, data.id);
        io.of(namespace.name).emit(SocketEvent.ON_REMOVED_MESSAGE, {
          channelId,
          messageId,
          latestModify: channel.latestModify,
        });

        // loop in all users of this [channelId]
        for (const userId of channel.users) {
          // send to user who is online
          if (!teamUserSocketIds[userId]) continue;

          // send [channel.latestModify] to all users of this [channelId]
          io.of(`/${teamId}`)
            .to(teamUserSocketIds[userId])
            .emit(SocketEvent.ON_EDITED_CHANNEL_LATEST_MOFIDY, channelId, channel.latestModify);
        }
      } catch (e) {
        console.log(e);
      }
    });

    // emit remove message file
    socket.on(SocketEvent.EMIT_REMOVE_MESSAGE_FILE, async (payload) => {
      try {
        const { data } = payload;
        const message = await messagesServices.removeFile(data.id, data.fileId);
        io.of(namespace.name).emit(SocketEvent.ON_REMOVED_MESSAGE_FILE, message);
      } catch (e) {
        console.log(e);
      }
    });

    // emit start message
    socket.on(SocketEvent.EMIT_STAR_MESSAGE, async (payload) => {
      try {
        const { data } = payload;
        const message = await messagesServices.star(data.id);
        io.of(namespace.name).emit(SocketEvent.ON_EDITED_MESSAGE, message);
      } catch (e) {
        console.log(e);
      }
    });

    // emit reaction message
    socket.on(SocketEvent.EMIT_REACTION_MESSAGE, async (payload) => {
      try {
        const { data } = payload;
        const message = await messagesServices.reaction(data.id, {
          userId: socket.userId,
          reactionId: data.reactionId,
        });
        io.of(namespace.name).emit(SocketEvent.ON_EDITED_MESSAGE, message);
      } catch (e) {
        console.log(e);
      }
    });

    socket.on(SocketEventDefault.DISCONNECT, () => {
      delete channelUserSocketIds[socket.userId];
    });
  });

  return workspace;
};

export default channelSocketHandler;

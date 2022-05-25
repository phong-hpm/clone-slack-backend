import { getChanelHistory, clearChannelUnreadMessageCount } from "#services/channels.service.js";
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

    socket.on(SocketEvent.EMIT_LOAD_MESSAGES, async (payload) => {
      try {
        const { limit = 2 } = payload;

        const options = {
          isDeep: true,
          limit,
        };

        const history = await getChanelHistory(channelId, options);
        socket.emit(SocketEvent.ON_MESSAGES, channelId, history);

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
    socket.on(SocketEvent.EMIT_ADD_MESSAGE, (payload) => {
      try {
        const { data } = payload;

        // add new message
        const addParams = { teamId, channelId, userId: socket.userId, delta: data.delta };
        const { message, unreadMessageCount } = messagesServices.add(addParams);

        // emit new messages added
        io.of(namespace.name).emit(SocketEvent.ON_ADDED_MESSAGE, message);

        // emit update unreadMeesageCount to [teamId] socket's users who is in [channelId]
        for (const [userId, unreadCount] of Object.entries(unreadMessageCount || {})) {
          // dont send to connected users, because they are reading this channel
          if (channelUserSocketIds[userId]) continue;

          const socketId = teamUserSocketIds[userId];
          if (socketId) {
            io.of(`/${teamId}`)
              .to(socketId)
              .emit(SocketEvent.ON_EDITED_CHANNEL_UNREAD_MESSAGE_COUNT, channelId, unreadCount);
          }
        }
      } catch (e) {
        console.log(e);
      }
    });

    // emit edit message
    socket.on(SocketEvent.EMIT_EDIT_MESSAGE, (payload) => {
      try {
        const { data } = payload;
        const message = messagesServices.edit(data.id, { delta: data.delta });
        io.of(namespace.name).emit(SocketEvent.ON_EDITED_MESSAGE, message);
      } catch (e) {
        console.log(e);
      }
    });

    // emit remove message
    socket.on(SocketEvent.EMIT_REMOVE_MESSAGE, (payload) => {
      try {
        const { data } = payload;
        const removedId = messagesServices.remove(channelId, data.id);
        io.of(namespace.name).emit(SocketEvent.ON_REMOVED_MESSAGE, removedId);
      } catch (e) {
        console.log(e);
      }
    });

    // emit remove message file
    socket.on(SocketEvent.EMIT_REMOVE_MESSAGE_FILE, (payload) => {
      try {
        const { data } = payload;
        const message = messagesServices.removeFile(data.id, data.fileId);
        io.of(namespace.name).emit(SocketEvent.ON_REMOVED_MESSAGE_FILE, message);
      } catch (e) {
        console.log(e);
      }
    });

    // emit start message
    socket.on(SocketEvent.EMIT_STAR_MESSAGE, (payload) => {
      try {
        const { data } = payload;
        const message = messagesServices.star(data.id);
        io.of(namespace.name).emit(SocketEvent.ON_EDITED_MESSAGE, message);
      } catch (e) {
        console.log(e);
      }
    });

    // emit reaction message
    socket.on(SocketEvent.EMIT_REACTION_MESSAGE, (payload) => {
      try {
        const { data } = payload;
        const message = messagesServices.reaction(data.id, {
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

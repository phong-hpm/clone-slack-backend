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

    const emitEditedMessage = (channel, message) => {
      io.of(namespace.name).emit(SocketEvent.ON_EDITED_MESSAGE, {
        channelId,
        message,
        updatedTime: channel.updatedTime,
      });
    };

    const emitEditedChannelUpdatedTime = (channel) => {
      // loop in all users of this [channelId]
      for (const userId of channel.users) {
        // send to user who is online
        if (!teamUserSocketIds[userId]) continue;

        // send [channel.updatedTime] to all users of this [channelId]
        io.of(`/${teamId}`)
          .to(teamUserSocketIds[userId])
          .emit(SocketEvent.ON_EDITED_CHANNEL_UPDATED_TIME, channelId, channel.updatedTime);
      }
    };

    socket.on(SocketEvent.EMIT_LOAD_MESSAGES, async (payload) => {
      try {
        const { limit = 2 } = payload;

        const options = {
          isDeep: true,
          limit,
        };

        const { messages, updatedTime } = await getChannelHistory(channelId, options);
        socket.emit(SocketEvent.ON_MESSAGES, { channelId, messages, updatedTime });

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
          updatedTime: channel.updatedTime,
        });

        // loop in all users of this [channelId]
        for (const userId of channel.users) {
          // send to user who is online
          if (!teamUserSocketIds[userId]) continue;

          // send [channel.updatedTime] to all users of this [channelId]
          io.of(`/${teamId}`)
            .to(teamUserSocketIds[userId])
            .emit(SocketEvent.ON_EDITED_CHANNEL_UPDATED_TIME, channelId, channel.updatedTime);

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
        const editParams = { channelId, delta: data.delta };
        const { message, channel } = await messagesServices.editDelta(data.id, editParams);
        emitEditedMessage(channel, message);
        emitEditedChannelUpdatedTime(channel);
      } catch (e) {
        console.log(e);
      }
    });

    // emit start message
    socket.on(SocketEvent.EMIT_STAR_MESSAGE, async (payload) => {
      try {
        const { data } = payload;
        const editParams = { channelId };
        const { message, channel } = await messagesServices.editStar(data.id, editParams);
        emitEditedMessage(channel, message);
        emitEditedChannelUpdatedTime(channel);
      } catch (e) {
        console.log(e);
      }
    });

    // emit reaction message
    socket.on(SocketEvent.EMIT_REACTION_MESSAGE, async (payload) => {
      try {
        const { data } = payload;
        const editParams = { channelId, userId: socket.userId, reactionId: data.reactionId };
        const { message, channel } = await messagesServices.editReaction(data.id, editParams);
        emitEditedMessage(channel, message);
        emitEditedChannelUpdatedTime(channel);
      } catch (e) {
        console.log(e);
      }
    });

    // emit remove message
    socket.on(SocketEvent.EMIT_REMOVE_MESSAGE, async (payload) => {
      try {
        const { data } = payload;
        const { messageId, channel } = await messagesServices.remove(data.id, { channelId });
        io.of(namespace.name).emit(SocketEvent.ON_REMOVED_MESSAGE, {
          channelId,
          messageId,
          updatedTime: channel.updatedTime,
        });

        emitEditedChannelUpdatedTime(channel);
      } catch (e) {
        console.log(e);
      }
    });

    // emit remove message file
    socket.on(SocketEvent.EMIT_REMOVE_MESSAGE_FILE, async (payload) => {
      try {
        const { data } = payload;
        const { message, channel } = await messagesServices.removeFile(data.id, {
          channelId,
          fileId: data.fileId,
        });

        emitEditedMessage(channel, message);
        emitEditedChannelUpdatedTime(channel);
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

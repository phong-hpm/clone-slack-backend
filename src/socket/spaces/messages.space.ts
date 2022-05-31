import userService from "@services/user.service";
import channelService from "@services/channel.service";
import messagesService from "@services/message.service";

import { IoTeamData } from "@socket/spaces/team.space";

import { channelIdRegExp } from "@utils/generateId";
import { SocketEvent, SocketEventDefault } from "@utils/constant";

import {
  EmiStarMessageDataType,
  EmitAddMessageDataType,
  EmitEditMessageDataType,
  EmitPayload,
  EmitReactionMessageDataType,
  EmitRemoveMessageDataType,
  EmitRemoveMessageFileDataType,
  EmitShareToChannelDataType,
  EmitShareToGroupMessageDataType,
  IoChannelType,
  IoTeamType,
  SocketType,
} from "@socket/types";
import { ChannelType, MessageType } from "@database/apis/types";

class IoChannelData {
  ioTeamData: IoTeamData;
  teamId: string;
  channelId: string;
  socket: SocketType;
  team: IoTeamType;
  channel: IoChannelType;

  constructor({ teamId, channelId, socket }) {
    const ioTeamData = new IoTeamData({ teamId });
    const team = ioTeamData.team;

    // initiate ioChannels data if it haven't existed
    if (!team.channels[channelId]) {
      // initiate ioChannel data if its haven't exited
      team.channels[channelId] = { userSocketIds: {} };
    }
    team.channels[channelId].userSocketIds[socket.userId] = socket.id;

    this.ioTeamData = ioTeamData;
    this.teamId = teamId;
    this.channelId = channelId;
    this.socket = socket;
    this.team = team;
    this.channel = team.channels[channelId];
  }

  getChannelData(channelId: string) {
    if (!channelId)
      throw new Error(`[IoChannelData] - [getSocketId] - [channelId] is ${channelId}`);

    return this.team.channels[channelId];
  }

  getAllSocketIds() {
    return this.channel.userSocketIds;
  }

  getSocketId(userId: string) {
    if (!userId) throw new Error(`[IoChannelData] - [getSocketId] - [userId] is ${userId}`);
    return this.channel.userSocketIds[userId];
  }

  removeSocketId() {
    delete this.channel.userSocketIds[this.socket.userId];
  }
}

const channelSocketHandler = () => {
  const io = global.io;
  const channelWorkspace = io.of(channelIdRegExp);

  channelWorkspace.on(SocketEventDefault.CONNECTION, (socket: SocketType) => {
    const namespace = socket.nsp;
    const userId = socket.userId;
    const [teamId, channelId] = namespace.name.slice(1).split("/");
    const ioChannelData = new IoChannelData({ teamId, channelId, socket });
    const ioTeamData = ioChannelData.ioTeamData;
    const teamWorkspace = io.of(`/${teamId}`);

    const emitAddedMessage = (channel: ChannelType, message: MessageType) => {
      const data = { channelId, message, updatedTime: channel.updatedTime };
      io.of(namespace.name).emit(SocketEvent.ON_ADDED_MESSAGE, data);
    };

    const emitEditedMessage = (channel: ChannelType, message: MessageType) => {
      const data = { channelId, message, updatedTime: channel.updatedTime };
      io.of(namespace.name).emit(SocketEvent.ON_EDITED_MESSAGE, data);
    };

    const emitEditedChannelUpdatedTime = (channel: ChannelType) => {
      try {
        const eventName = SocketEvent.ON_EDITED_CHANNEL_UPDATED_TIME;
        const data = { channelId: channel.id, updatedTime: channel.updatedTime };
        const teamSocketIdList = ioTeamData.getSocketIdListByUserIdList(channel.users);
        teamWorkspace.to(teamSocketIdList).emit(eventName, data);
      } catch (e) {
        console.log(e);
      }
    };

    const emitEditedUnreadMessageCount = (
      id: string,
      userIds: string[],
      unreadMessageCount: Record<string, number>
    ) => {
      // loop in all users of this [channelId]
      for (const userId of userIds) {
        io.of(`${teamId}`)
          .to(ioTeamData.getSocketId(userId))
          .emit(SocketEvent.ON_EDITED_CHANNEL_UNREAD_MESSAGE_COUNT, {
            channelId: id,
            unreadMessageCount: unreadMessageCount[userId],
          });
      }
    };

    const emitShareMessageToChannel = async (payload: EmitPayload<EmitShareToChannelDataType>) => {
      try {
        const { toChannelId, delta, sharedMessageId } = payload.data;

        const shareParams = {
          teamId,
          channelId,
          userId,
          toChannelId,
          delta,
          sharedMessageId,
          ignoreUsers: [] as string[],
        };
        // get [socketId] of user who are seening at [toChannelId]
        const toChannelUserSocketIds = ioChannelData.getChannelData(toChannelId)?.userSocketIds;
        // they are reading this [toChannelId]
        shareParams.ignoreUsers = Object.keys(toChannelUserSocketIds || {});
        const {
          message,
          unreadMessageCount,
          channel: toChannel,
        } = await messagesService.share(shareParams);

        // emit new message to client
        io.of(`/${teamId}/${toChannelId}`).emit(SocketEvent.ON_ADDED_MESSAGE, {
          toChannelId,
          message,
          updatedTime: toChannel.updatedTime,
        });

        emitEditedUnreadMessageCount(toChannel.id, toChannel.users, unreadMessageCount);
        emitEditedChannelUpdatedTime(toChannel);

        socket.emit(SocketEvent.ON_SHARE_MESSAGE_TO_CHANNEL, {
          toChannelId,
          message,
          updatedTime: toChannel.updatedTime,
        });
      } catch (e) {
        console.log(e);
      }
    };

    socket.on(SocketEvent.EMIT_LOAD_MESSAGES, async () => {
      try {
        const { messages, updatedTime } = await channelService.getHistory(channelId);
        socket.emit(SocketEvent.ON_MESSAGES, { channelId, messages, updatedTime });

        // clear [unreadMessageCount] for this [userId] in [channelId]
        await channelService.clearUnreadMessageCount(channelId, [userId]);

        emitEditedUnreadMessageCount(channelId, [userId], { [userId]: 0 });
      } catch (e) {
        console.log(e);
      }
    });

    // emit new message
    socket.on(
      SocketEvent.EMIT_ADD_MESSAGE,
      async (payload: EmitPayload<EmitAddMessageDataType>) => {
        try {
          const { delta } = payload.data;

          const addParams = { teamId, channelId, userId, delta, ignoreUsers: [] };
          // they are reading this [channelId]
          addParams.ignoreUsers = Object.keys(ioChannelData.getAllSocketIds());
          const { message, unreadMessageCount, channel } = await messagesService.add(addParams);

          // emit new messages added to all connected users
          emitAddedMessage(channel, message);
          emitEditedUnreadMessageCount(channel.id, channel.users, unreadMessageCount);
          emitEditedChannelUpdatedTime(channel);
        } catch (e) {
          console.log(e);
        }
      }
    );

    // emit share message
    socket.on(SocketEvent.EMIT_SHARE_MESSAGE_TO_CHANNEL, emitShareMessageToChannel);

    // emit share to muitiple users
    socket.on(
      SocketEvent.EMIT_SHARE_MESSAGE_TO_GROUP_USERS,
      async (payload: EmitPayload<EmitShareToGroupMessageDataType>) => {
        try {
          const { toUserIds, delta, sharedMessageId } = payload.data;

          //  if only 1 user, that mean client call wrong socket event
          if (!toUserIds || toUserIds.length < 2) return;

          // build channelName
          const toUsers = await userService.getUserInfosByIdList(toUserIds.sort());
          const channelAvatar = toUsers[Object.keys(toUsers)[0]]?.avatar;
          const channelNameList = [];
          for (const user of Object.values(toUsers)) channelNameList.push(user.name);
          const channelName = channelNameList.join(", ");

          // get channel by channelName
          let channel = await channelService.find({ name: channelName, team: teamId });

          if (!channel) {
            channel = await channelService.add({
              teamId,
              type: "group_message",
              userId: socket.userId,
              users: toUserIds,
              name: channelName,
              avatar: channelAvatar,
            });
            const channelView = await channelService.getView(channel.id, socket.userId);

            // emit new channel to client
            teamWorkspace
              .to(ioTeamData.getSocketIdListByUserIdList(channel.users))
              .emit(SocketEvent.ON_ADDED_CHANNEL, channelView);
          }

          // after create new [group_message], share this [sharedMessageId] to [group_message]
          emitShareMessageToChannel({ data: { toChannelId: channel.id, delta, sharedMessageId } });
        } catch (e) {
          console.log(e);
        }
      }
    );

    // emit edit message
    socket.on(
      SocketEvent.EMIT_EDIT_MESSAGE,
      async (payload: EmitPayload<EmitEditMessageDataType>) => {
        try {
          const { id, delta } = payload.data;
          const { message, channel } = await messagesService.editDelta(id, { channelId, delta });
          emitEditedMessage(channel, message);
          emitEditedChannelUpdatedTime(channel);
        } catch (e) {
          console.log(e);
        }
      }
    );

    // emit start message
    socket.on(
      SocketEvent.EMIT_STAR_MESSAGE,
      async (payload: EmitPayload<EmiStarMessageDataType>) => {
        try {
          const { id } = payload.data;
          const { message, channel } = await messagesService.editStar(id, { channelId });
          emitEditedMessage(channel, message);
          emitEditedChannelUpdatedTime(channel);
        } catch (e) {
          console.log(e);
        }
      }
    );

    // emit reaction message
    socket.on(
      SocketEvent.EMIT_REACTION_MESSAGE,
      async (payload: EmitPayload<EmitReactionMessageDataType>) => {
        try {
          const { id, reactionId } = payload.data;
          const editParams = { channelId, userId: socket.userId, reactionId };
          const { message, channel } = await messagesService.editReaction(id, editParams);
          emitEditedMessage(channel, message);
          emitEditedChannelUpdatedTime(channel);
        } catch (e) {
          console.log(e);
        }
      }
    );

    // emit remove message
    socket.on(
      SocketEvent.EMIT_REMOVE_MESSAGE,
      async (payload: EmitPayload<EmitRemoveMessageDataType>) => {
        try {
          const { id } = payload.data;
          const { messageId, channel } = await messagesService.remove(id, { channelId });
          io.of(namespace.name).emit(SocketEvent.ON_REMOVED_MESSAGE, {
            channelId,
            messageId,
            updatedTime: channel.updatedTime,
          });

          emitEditedChannelUpdatedTime(channel);
        } catch (e) {
          console.log(e);
        }
      }
    );

    // emit remove message file
    socket.on(
      SocketEvent.EMIT_REMOVE_MESSAGE_FILE,
      async (payload: EmitPayload<EmitRemoveMessageFileDataType>) => {
        try {
          const { id, fileId } = payload.data;
          const { message, channel } = await messagesService.removeFile(id, { channelId, fileId });

          emitEditedMessage(channel, message);
          emitEditedChannelUpdatedTime(channel);
        } catch (e) {
          console.log(e);
        }
      }
    );

    socket.on(SocketEventDefault.DISCONNECT, () => {
      ioChannelData.removeSocketId();
    });
  });

  return channelWorkspace;
};

export default channelSocketHandler;

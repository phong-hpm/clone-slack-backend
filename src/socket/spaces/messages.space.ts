import userService from "@services/user.service";
import channelService from "@services/channel.service";
import messageService from "@services/message.service";

import { IoTeamData } from "@socket/spaces/team.space";

import { SocketEvent, SocketEventDefault } from "@utils/constant";

import {
  EmiStarMessageDataType,
  EmitAddMessageDataType,
  EmitEditMessageDataType,
  EmitLoadMessageDataType,
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
import setupMessageEmiter from "@socket/emiters/message";
import setupChannelEmiter from "@socket/emiters/channel";

export class IoChannelData {
  spaceName: string;
  ioTeamData: IoTeamData;
  teamId: string;
  channelId: string;
  userId: string;
  socket: SocketType;
  team: IoTeamType;
  channel: IoChannelType;

  constructor({ teamId, channelId, socket }) {
    const ioTeamData = new IoTeamData({ teamId });
    const team = ioTeamData.team;

    // initiate ioChannels data if it haven't existed
    if (!team.channels[channelId]) {
      // initiate ioChannel data if its haven't exited
      team.channels[channelId] = { userSocketIds: {}, message: {} };
    }
    team.channels[channelId].userSocketIds[socket.userId] = socket.id;

    this.spaceName = `/${teamId}/${channelId}`;
    this.ioTeamData = ioTeamData;
    this.teamId = teamId;
    this.channelId = channelId;
    this.userId = socket.userId;
    this.socket = socket;
    this.team = team;
    this.channel = team.channels[channelId];
  }

  setChannelMessageData(messageData: IoChannelType["message"]) {
    this.channel.message = messageData;
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
  const channelWorkspace = io.of(/^\/T-[a-zA-Z0-9]+\/(C|D|G)-[a-zA-Z0-9]+$/);

  channelWorkspace.on(SocketEventDefault.CONNECTION, (socket: SocketType) => {
    const namespace = socket.nsp;
    const userId = socket.userId;
    const [teamId, channelId] = namespace.name.slice(1).split("/");
    const ioChannelData = new IoChannelData({ teamId, channelId, socket });
    const ioTeamData = ioChannelData.ioTeamData;

    const channelEmiter = setupChannelEmiter(ioTeamData);
    const messageEmiter = setupMessageEmiter(ioChannelData);

    socket.on(
      SocketEvent.EMIT_LOAD_MESSAGES,
      async (payload: EmitPayload<EmitLoadMessageDataType>) => {
        try {
          const { limit } = payload.data;
          const { messages, updatedTime, loadedFromTime, hasMore } =
            await channelService.getHistory(channelId, { limit });
          // clear [unreadMessageCount] for this [userId] in [channelId]
          await channelService.clearUnreadMessageCount(channelId, [userId]);

          messageEmiter.emitLoadMessage({ messages, updatedTime, loadedFromTime, hasMore });
          channelEmiter.emitEditedChannelUnread(channelId, [userId], { [userId]: 0 });
        } catch (e) {
          console.log(e);
        }
      }
    );

    socket.on(
      SocketEvent.EMIT_LOAD_MORE_MESSAGES,
      async (payload: EmitPayload<EmitLoadMessageDataType>) => {
        try {
          const { limit } = payload.data;
          const ioMessageData = ioChannelData.channel.message;

          // there are no more messages left
          if (!ioMessageData.hasMore) {
            ioChannelData.socket.emit(SocketEvent.ON_MORE_MESSAGES, { messages: [] });
          } else {
            const { messages, loadedFromTime, hasMore } = await channelService.getHistory(
              ioChannelData.channelId,
              { limit, beforeTime: ioMessageData.loadedFromTime }
            );
            messageEmiter.emitLoadMoreMessages({ messages, loadedFromTime, hasMore });
          }
        } catch (e) {
          console.log(e);
        }
      }
    );

    // emit new message
    socket.on(
      SocketEvent.EMIT_ADD_MESSAGE,
      async (payload: EmitPayload<EmitAddMessageDataType>) => {
        try {
          const { delta } = payload.data;
          const addParams = { teamId, channelId, userId, delta, ignoreUsers: [] };
          // they are reading this [channelId]
          addParams.ignoreUsers = Object.keys(ioChannelData.getAllSocketIds());
          const { message, unreadMessageCount, channel } = await messageService.add(addParams);

          messageEmiter.emitAddedMessage(message, channel);
          channelEmiter.emitEditedChannelUnread(channel.id, channel.users, unreadMessageCount);
          channelEmiter.emitEditedChannelUpdatedTime(channel);
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
          const { message, channel } = await messageService.editDelta(id, { channelId, delta });
          messageEmiter.emitEditedMessage(channel, message);
          channelEmiter.emitEditedChannelUpdatedTime(channel);
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
          const { message, channel } = await messageService.editStar(id, { channelId });
          messageEmiter.emitEditedMessage(channel, message);
          channelEmiter.emitEditedChannelUpdatedTime(channel);
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
          const { message, channel } = await messageService.editReaction(id, editParams);
          messageEmiter.emitEditedMessage(channel, message);
          channelEmiter.emitEditedChannelUpdatedTime(channel);
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
          const { messageId, channel } = await messageService.remove(id, { channelId });

          messageEmiter.emitRemovedMessage(messageId, channel);
          channelEmiter.emitEditedChannelUpdatedTime(channel);
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
          const { message, channel } = await messageService.removeFile(id, { channelId, fileId });

          messageEmiter.emitEditedMessage(channel, message);
          channelEmiter.emitEditedChannelUpdatedTime(channel);
        } catch (e) {
          console.log(e);
        }
      }
    );

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
        } = await messageService.share(shareParams);

        // emit new message to client
        io._nsps.get(`/${teamId}/${toChannelId}`)?.emit(SocketEvent.ON_ADDED_MESSAGE, {
          toChannelId,
          message,
          updatedTime: toChannel.updatedTime,
        });

        channelEmiter.emitEditedChannelUnread(toChannel.id, toChannel.users, unreadMessageCount);
        channelEmiter.emitEditedChannelUpdatedTime(toChannel);

        socket.emit(SocketEvent.ON_SHARE_MESSAGE_TO_CHANNEL, {
          toChannelId,
          message,
          updatedTime: toChannel.updatedTime,
        });
      } catch (e) {
        console.log(e);
      }
    };

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
            const socketList = ioTeamData.getSocketIdListByUserIdList(channel.users);
            io._nsps
              .get(`/${teamId}`)
              ?.to(socketList)
              .emit(SocketEvent.ON_ADDED_CHANNEL, channelView);
          }

          // after create new [group_message], share this [sharedMessageId] to [group_message]
          emitShareMessageToChannel({ data: { toChannelId: channel.id, delta, sharedMessageId } });
        } catch (e) {
          console.log(e);
        }
      }
    );

    socket.on(SocketEventDefault.DISCONNECT, () => {
      ioChannelData.removeSocketId();
    });

    socket.on(SocketEventDefault.ERROR, (error) => {
      console.log("SocketEventDefault.CONNECT_ERROR", error);
    });
  });

  return channelWorkspace;
};

export default channelSocketHandler;

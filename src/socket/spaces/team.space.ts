import teamsService from "@services/team.service";
import channelService from "@services/channel.service";
import userService from "@services/user.service";

// utils
import { SocketEvent, SocketEventDefault } from "@utils/constant";

import {
  EmitAddChannelDataType,
  EmitAddUsersToChannelDataType,
  EmitPayload,
  EmitRemoveUserFromChannelDataType,
  IoTeamType,
  SocketType,
} from "@socket/types";

export class IoTeamData {
  spaceName: string;
  teamId: string;
  socket: SocketType;
  team: IoTeamType;

  constructor({ teamId, socket }: { teamId: string; socket?: SocketType }) {
    if (!global.io) throw new Error("io instance is null");
    // initiate data if it haven't existed
    if (!global.io.teams[teamId]) {
      // initiate ioTeam data if its haven't exited
      global.io.teams[teamId] = { channels: {}, userSocketIds: {} };
    }
    // initiate socketUser to userSocketIds
    if (socket) global.io.teams[teamId].userSocketIds[socket.userId] = socket.id;

    this.spaceName = `/${teamId}`;
    this.teamId = teamId;
    this.socket = socket;
    this.team = global.io.teams[this.teamId];
  }

  getSocketId(userId: string) {
    if (!userId) throw new Error(`[IoTeamData] - [getSocketId] - [userId] is ${userId}`);
    return this.team.userSocketIds[userId];
  }

  getSocketIdListByUserIdList(userIds: string[] = []) {
    const socketIdList = [];
    userIds.forEach((userId) => {
      if (this.team.userSocketIds[userId]) {
        socketIdList.push(this.team.userSocketIds[userId]);
      }
    });
    return socketIdList;
  }

  removeSocketId() {
    delete this.team.userSocketIds[this.socket.userId];
  }
}

const teamSocketHandler = () => {
  const io = global.io;
  const workspace = io.of(/^\/T-[a-zA-Z0-9]+$/);

  workspace.on(SocketEventDefault.CONNECTION, (socket: SocketType) => {
    const namespace = socket.nsp;
    const userId = socket.userId;
    const teamId = namespace.name.slice(1);
    const ioTeamData = new IoTeamData({ teamId, socket });

    // on users online
    socket.broadcast.emit(SocketEvent.ON_USER_ONLINE, socket.userId);

    socket.on(SocketEvent.EMIT_LOAD_CHANNELS, async () => {
      try {
        const teamView = await teamsService.getView(teamId, socket.userId);

        const channels = teamView.channels.map((channel) => {
          if (!channel.partner) return channel;
          const partner = channel.partner;
          return {
            ...channel,
            partner: { ...partner, isOnline: !!ioTeamData.getSocketId(partner.id) },
          };
        });

        const users = teamView.users.map((user) => ({
          ...user,
          isOnline: !!ioTeamData.getSocketId(user.id),
        }));
        socket.emit(SocketEvent.ON_CHANNELS, { ...teamView, channels, users });
      } catch (e) {
        console.log(e);
      }
    });

    socket.on(
      SocketEvent.EMIT_ADD_CHANNEL,
      async (payload: EmitPayload<EmitAddChannelDataType>) => {
        try {
          const { name, desc } = payload.data;
          const channel = await channelService.add({ teamId, type: "channel", userId, name, desc });
          const channelView = await channelService.getView(channel.id, socket.userId);

          // emit to users of this channel only
          const socketIdList = ioTeamData.getSocketIdListByUserIdList(channel.users);
          io.of(namespace.name).to(socketIdList).emit(SocketEvent.ON_ADDED_CHANNEL, channelView);
        } catch (e) {
          console.log(e);
        }
      }
    );

    socket.on(
      SocketEvent.EMIT_ADD_USERS_TO_CHANNEL,
      async (payload: EmitPayload<EmitAddUsersToChannelDataType>) => {
        try {
          const { id, userIds: userTargetIds } = payload.data;
          const channel = await channelService.addUsersToChannel(id, { userIds: userTargetIds });
          const userInfos = await userService.getUserInfosByIdList(channel.users);

          const socketIdList = ioTeamData.getSocketIdListByUserIdList(channel.users);
          io.of(namespace.name)
            .to(socketIdList)
            .emit(SocketEvent.ON_EDITED_CHANNEL_USERS, {
              channelId: id,
              userIds: channel.users,
              users: Object.values(userInfos),
            });
        } catch (e) {
          console.log(e);
        }
      }
    );

    socket.on(
      SocketEvent.EMIT_REMOVE_USER_FROM_CHANNEL,
      async (payload: EmitPayload<EmitRemoveUserFromChannelDataType>) => {
        try {
          const { id, userId: userTargetId } = payload.data;
          const channel = await channelService.removeUserFromChannel(id, { userId: userTargetId });
          const channelView = await channelService.getView(channel.id, socket.userId);

          const socketIdList = ioTeamData.getSocketIdListByUserIdList(channel.users);
          io.of(namespace.name)
            .to(socketIdList)
            .emit(SocketEvent.ON_EDITED_CHANNEL, { channel: channelView });
        } catch (e) {
          console.log(e);
        }
      }
    );

    socket.on(SocketEventDefault.DISCONNECT, () => {
      ioTeamData.removeSocketId();
    });
  });

  return workspace;
};

export default teamSocketHandler;

import teamsService from "@services/team.service";
import channelService from "@services/channel.service";

// utils
import { teamIdRegExp } from "@utils/generateId";
import { SocketEvent, SocketEventDefault } from "@utils/constant";

import { EmitAddChannelDataType, EmitPayload, IoTeamType, SocketType } from "@socket/types";

export class IoTeamData {
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
  const workspace = io.of(teamIdRegExp);

  workspace.on(SocketEventDefault.CONNECTION, (socket: SocketType) => {
    const namespace = socket.nsp;
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
          const { data } = payload;
          const channel = await channelService.add({
            teamId,
            type: "channel",
            userId: socket.userId,
            name: data.name,
            desc: data.desc,
          });
          const channelView = await channelService.getView(channel.id, socket.userId);

          // emit to users of this channel only
          channel.users.forEach((user) => {
            if (!ioTeamData.getSocketId(user)) return;
            io.of(namespace.name)
              .to(ioTeamData.getSocketId(user))
              .emit(SocketEvent.ON_ADDED_CHANNEL, channelView);
          });
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

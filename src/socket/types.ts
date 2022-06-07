import { ChannelType, MessageType } from "@database/apis/types";
import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export interface IoChannelType {
  userSocketIds?: Record<string, string>;
  message: {
    loadedFromTime?: number;
    hasMore?: boolean;
  };
}

export interface IoTeamType {
  channels?: Record<string, IoChannelType>;
  userSocketIds?: Record<string, string>;
}

export interface IoType extends Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> {
  teams?: Record<string, IoTeamType>;
}

export interface SocketType
  extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> {
  userId?: string;
  name?: string;
  email?: string;
  accessToken?: string;
  timeoutTokenId?: NodeJS.Timer;
}

export interface EmitPayload<T> {
  data: T;
}

// teams.space.ts -----------------
export interface EmitAddChannelDataType {
  name: string;
  desc?: string;
}
export interface EmitAddUsersToChannelDataType {
  id: string;
  userIds: string[];
}
export interface EmitRemoveUserFromChannelDataType {
  id: string;
  userId: string;
}
export interface EmitEditNameChannelDataType {
  id: string;
  name: string;
}
export interface EmitEditChannelOptionalFieldsDataType
  extends Partial<Pick<ChannelType, "isStarred" | "topic" | "desc" | "notification">> {
  id: string;
}

// messages.space.ts -----------------

export interface EmitLoadMessageDataType {
  limit: number;
}

export interface EmitAddMessageDataType {
  delta: MessageType["delta"];
}

export interface EmitShareToChannelDataType {
  toChannelId: string;
  sharedMessageId: string;
  delta: MessageType["delta"];
}

export interface EmitShareToGroupMessageDataType {
  toUserIds: string[];
  sharedMessageId: string;
  delta: MessageType["delta"];
}

export interface EmitEditMessageDataType {
  id: string;
  delta: MessageType["delta"];
}

export interface EmiStarMessageDataType {
  id: string;
}

export interface EmitReactionMessageDataType {
  id: string;
  reactionId: string;
}

export interface EmitRemoveMessageDataType {
  id: string;
}

export interface EmitRemoveMessageFileDataType {
  id: string;
  fileId: string;
}

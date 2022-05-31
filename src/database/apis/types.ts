import { UserInfoViewType } from "@services/types";

export interface UserType {
  id: string;
  email: string;
  password: string;
  refreshToken: string;
  updatedTime: number;
}

export interface UserInfoType {
  id: string;
  name: string;
  realname: string;
  email: string;
  timeZone: string;
  avatar: string;
  teams: string[];
  createdTime: number;
  updatedTime: number;
}

export interface UserEmailVerifyingType {
  id: string;
  email: string;
  verifyCode: string;
  createdTime: number;
}

export interface TeamType {
  id: string;
  name: string;
  channels: string[];
  users: string[];
  createdTime: number;
  updatedTime: number;
}

export interface ChannelType {
  id: string;
  type: "channel" | "direct_message" | "group_message";
  name: string;
  desc?: string;
  users: string[];
  unreadMessageCount: Record<string, number>;
  team: string;
  creator: string;
  createdTime: number;
  updatedTime: number;
  partner?: UserInfoViewType;
  avatar?: string;
}

export interface MessageType {
  id: string;
  type: string;
  delta: { ops: any[] };
  team: string;
  user: string;
  isEdited?: boolean;
  isStared?: boolean;
  reactions: Record<string, { id: string; users: string[]; count: number }>;
  files?: MessageFileType[];
  sharedMessageId?: string;
  sharedMessage?: Omit<MessageType, "sharedMessage" | "sharedMessageId">;
  sharedMessageOwner?: UserInfoType;
  createdTime: number;
  updatedTime: number;
}

export interface MessageFileType {
  id: string;
  url: string;
  createdTime: number;
  type: "audio" | "video";
  mineType: "audio/webm" | "video/webm";
  duration: number;
  size?: number;
  wavePeaks?: number[];
  scripts?: TranScriptType[];
  ratio?: number;
  thumb?: string;
  thumbList?: string[];
  status?: "uploading" | "done";
  uploadId?: string;
}

export interface TranScriptType {
  currentTime: number;
  label: string;
}

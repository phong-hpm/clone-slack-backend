import { ChannelType, MessageType, TeamType, UserInfoType } from "@database/apis/types";

export interface TeamViewType extends Omit<TeamType, "channels" | "users"> {
  channels: ChannelType[];
  users: UserInfoType[];
}
export interface ChannelViewType extends Omit<ChannelType, "unreadMessageCount"> {
  unreadMessageCount: number;
}

export interface MessageViewType extends Omit<MessageType, "sharedMessageId" | "users"> {
  users: UserInfoType[];
}

export interface UserInfoViewType extends Omit<UserInfoType, "teams"> {
  teams: TeamType[];
}

export interface InputFileType {
  name: string;
  mimetype: "video/webm" | "audio/webm" | "json/image";
  data: Buffer;
  type: "video" | "audio" | "image" | "thumb";
  mineType: string;
}

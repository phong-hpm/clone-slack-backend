import { tableApis } from "@database/apis/_tableApis";

import {
  UserType,
  UserInfoType,
  UserEmailVerifyingType,
  TeamType,
  ChannelType,
  MessageType,
} from "@database/apis/types";

export const usersTable = tableApis<UserType>("users");
export const userInfoTable = tableApis<UserInfoType>("user_info");
export const userEmailVerifyingTable = tableApis<UserEmailVerifyingType>("user_email_verifying");
export const teamsTable = tableApis<TeamType>("teams");
export const channelsTable = tableApis<ChannelType>("channels");
export const channelMessagesTable = tableApis<string[]>("channel_messages");
export const messagesTable = tableApis<MessageType>("messages");

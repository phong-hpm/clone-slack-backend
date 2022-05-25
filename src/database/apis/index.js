import * as lowdb from "lowdb";
import { join } from "path";
import { tableApis } from "./_tableApis.js";

const jsonPath = `${process.cwd()}/src/database/json`;

export const getDB = (file) => {
  return new lowdb.LowSync(new lowdb.JSONFileSync(join(jsonPath, file)));
};

// Use JSON file for storage
export const db = new lowdb.Low(new lowdb.JSONFileSync(join(jsonPath, "db.json")));

export const getTable = async (tableName) => {
  await db.read();
  return db.data[tableName];
};

export const writeData = async () => {
  await db.write();
};

export const updateData = async (callback) => {
  const result = callback(db.data);
  await db.write();
  return result;
};

export const usersTable = tableApis("users");
export const userInfoTable = tableApis("user_info");
export const teamsTable = tableApis("teams");
export const channelsTable = tableApis("channels");
export const channelMessagesTable = tableApis("channel_messages");
export const messagesTable = tableApis("messages");

import { getTable, writeData } from "../database/index.js";
import { generateId } from "../utils/generateId.js";

export const getChanel = async (id) => {
  try {
    const channels = await getTable("channels");
    return channels[id];
  } catch {
    return null;
  }
};

export const createChanel = async (channel) => {
  try {
    const id = generateId();
    const channels = await getTable("channels");
    channels[id] = channel;
    await writeData();
    return true;
  } catch (e) {
    return false;
  }
};

export const updateChanel = async ({ id, latestModify }) => {
  try {
    const channels = await getTable("channels");
    if (!channels[id]) return null;
    channels[id].latestModify = latestModify;
    await writeData();
    return getChanel(id);
  } catch (e) {
    return null;
  }
};

export const increateUnread = async ({ id, ignoreUsers = [] }) => {
  try {
    const channels = await getTable("channels");
    const channel = channels[id];
    if (!channel) return {};
    const unreadMessageCount = { ...channel.unreadMessageCount };
    for (const [id] of Object.entries(unreadMessageCount)) {
      if (ignoreUsers.includes(id)) continue;
      unreadMessageCount[id]++;
    }
    channel.unreadMessageCount = unreadMessageCount;
    await writeData();
    return { channel: getChanel(id), unreadMessageCount: channel.unreadMessageCount };
  } catch {
    return {};
  }
};

export const clearUnread = async ({ id, users = [] }) => {
  try {
    const channels = await getTable("channels");
    const channel = channels[id];
    if (!channel || !users.length) return {};
    users.forEach((userId) => (channel.unreadMessageCount[userId] = 0));
    await writeData();
    return { channel: getChanel(id), unreadMessageCount: channel.unreadMessageCount };
  } catch {
    return {};
  }
};

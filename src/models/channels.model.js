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
    const channels = getTable("channels");
    channels[id] = channel;
    await writeData();
    return true;
  } catch (e) {
    return false;
  }
};

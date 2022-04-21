import { getTable, writeData } from "../database/index.js";
import { generateId } from "../utils/generateId.js";

export const getMessage = async (id) => {
  try {
    const messages = await getTable("messages");
    return messages[id];
  } catch {
    return null;
  }
};

export const getMessages = async (limit) => {
  try {
    const messages = await getTable("messages");
    return messages[id];
  } catch {
    return null;
  }
};

export const createTeam = async (message) => {
  try {
    const id = generateId();
    const messages = await getTable("messages");
    messages[id] = team;
    await writeData();
    return true;
  } catch (e) {
    return false;
  }
};

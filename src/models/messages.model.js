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

export const createMessage = async ({ text, team, user, type }) => {
  try {
    const id = `M-${generateId()}`;
    const messages = await getTable("messages");
    messages[id] = {
      id,
      text,
      type,
      created: Date.now(),
      user,
      team,
    };
    await writeData();
    return messages[id];
  } catch (e) {
    return null;
  }
};

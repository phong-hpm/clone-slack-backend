import { getTable, writeData } from "../database/index.js";
import { generateId } from "../utils/generateId.js";

export const getChanel = async (id) => {
  try {
    const chanels = await getTable("chanels");
    return chanels[id];
  } catch {
    return null;
  }
};

export const createChanel = async (chanel) => {
  try {
    const id = generateId();
    const chanels = getTable("chanels");
    chanels[id] = chanel;
    await writeData();
    return true;
  } catch (e) {
    return false;
  }
};

import { getTable, writeData } from "../database/index.js";
import { generateId } from "../utils/generateId.js";

export const getTeam = async (id) => {
  try {
    const teams = await getTable("teams");
    return teams[id];
  } catch {
    return null;
  }
};

export const createTeam = async (team) => {
  try {
    const id = generateId();
    const teams = await getTable("teams");
    teams[id] = team;
    await writeData();
    return true;
  } catch (e) {
    return false;
  }
};

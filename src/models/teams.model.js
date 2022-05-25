import { teamsTable } from "#database/apis/index.js";

export const getTeamById = async (id) => {
  return teamsTable.readById(id);
};

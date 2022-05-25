import { teamsTable } from "#database/apis/index.js";

export const getTeamById = (id) => {
  return teamsTable.readById(id);
};

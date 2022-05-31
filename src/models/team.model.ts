import { teamsTable } from "@database/apis";

const getById = async (id: string) => {
  return teamsTable.readById(id);
};

const teamModel = { getById };

export default teamModel;

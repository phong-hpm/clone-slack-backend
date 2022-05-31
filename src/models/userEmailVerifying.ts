import { userEmailVerifyingTable } from "@database/apis";
import { UserEmailVerifyingType } from "@database/apis/types";
import { generateId } from "@utils/generateId";

const getById = async (id: string) => {
  return userEmailVerifyingTable.readById(id);
};

const find = async (searchObj: Partial<UserEmailVerifyingType>) => {
  return userEmailVerifyingTable.find(searchObj);
};

const insert = async (data: { email: string; verifyCode: string }) => {
  const { email, verifyCode } = data;
  const id = `V-${generateId()}`;

  // add user
  return await userEmailVerifyingTable.insert(id, { id, email, verifyCode });
};

const remove = async (id: string) => {
  await userEmailVerifyingTable.remove(id);
  return id;
};

const userEmailVerifyingModel = {
  getById,
  find,
  insert,
  remove,
};

export default userEmailVerifyingModel;

import { db, getData, updateData } from "../database/index.js";

export const getChanels = () => getData((data) => data.chanels);
export const getChanelById = (id) => getData((data) => data.chanels[id]);

export const updateChanels = (callback) => {
  return updateData((data) => callback(data.chanels));
};

export const addChanel = () => {
  return updateChanels((chanels) => {
    const lastId = (chanels.lastId || 0) + 1;

    chanels[lastId] = {
      id: lastId,
      data: {
        users: [],
        messages: { lastId: 1 },
      },
    };
    chanels.lastId = lastId;

    return chanels[lastId];
  });
};

export const updateChanelById = async (id, callback) => {
  const chanel = await getChanelById(id);
  if (!chanel) return { error: "chanel id doesn't exist" };

  return updateChanels((chanels) => callback(chanels[id]));
};

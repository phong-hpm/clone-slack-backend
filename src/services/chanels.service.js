import * as chanelsModel from "../models/chanels.model.js";

export const getById = (id) => {
  return chanelsModel.getChanel(id);
};
export const addChanel = () => {
  return createChanel();
};

// export const updateChanelById = async (id, callback) => {
//   const chanel = await getChanelById(id);
//   if (!chanel) return { error: "chanel id doesn't exist" };

//   return updateChanels((chanels) => callback(chanels[id]));
// };

export const getChanelView = async (id) => {
  const chanelView = await chanelsModel.getChanel(id);
  delete chanelView.messages;
  return chanelView;
};

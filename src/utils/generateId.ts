import shortId from "shortid";

// Default: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'
export const generateId = () => {
  const id = shortId.generate();
  if (!id.includes("-") && !id.includes("_")) return id;
  return generateId();
};

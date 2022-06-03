import shortId from "shortid";

export const matchs = "[A-Z0-9]{8}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{12}";
export const teamIdRegExp = new RegExp(`^/T-${matchs}$`);
export const channelIdRegExp = new RegExp(`^/T-${matchs}/(C|D|G)-${matchs}$`);

// Default: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'
export const generateId = () => {
  const id = shortId.generate();
  if (!id.includes("-") && !id.includes("_")) return id;
  return generateId();
};

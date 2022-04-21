import { v4 as uuidv4 } from "uuid";

export const uuidMath = "[A-Z0-9]{8}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{12}";
export const chanelIdRegExp = new RegExp(`^/(C|U)-${uuidMath}$`);
export const teamIdRegExp = new RegExp(`^/T-${uuidMath}$`);
export const generateId = () => String(uuidv4()).toLocaleUpperCase();

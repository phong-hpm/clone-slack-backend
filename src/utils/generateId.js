import { v4 as uuidv4 } from "uuid";

export const generateId = () => Buffer.from(uuidv4(), "hex").toString("base64");

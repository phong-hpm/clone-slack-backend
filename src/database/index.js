import * as lowdb from "lowdb";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import lodash from "lodash";

class LowWithLodash extends lowdb.Low {
  chain = lodash.chain(this).get("data");
}

const __dirname = dirname(fileURLToPath(import.meta.url));

// Use JSON file for storage
const file = join(__dirname, "db.json");
const adapter = new lowdb.JSONFile(file);

export const db = new LowWithLodash(adapter);

export const getTable = async (tableName) => {
  await db.read();
  return db.data[tableName];
};

export const writeData = async () => {
  await db.write();
};

export const updateData = async (callback) => {
  const result = callback(db.data);
  await db.write();
  return result;
};

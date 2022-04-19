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

export const getData = async (callback) => {
  if (!db.data) await db.read();
  return callback(db.data);
};

export const updateData = async (callback) => {
  const result = callback(db.data);
  await db.write();
  return result;
};

export const initDatabase = async () => {
  db.data = {
    chanels: {
      1: {
        id: "1",
        messages: {
          1: {
            id: "1",
            text: "message 1",
          },
        },
      },
    },
  };

  await db.write();
};

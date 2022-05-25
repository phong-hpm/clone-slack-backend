import * as lowdb from "lowdb";
import { join } from "path";

const getDB = (file) => {
  const jsonPath = `${process.cwd()}/src/database/json`;
  return new lowdb.Low(new lowdb.JSONFile(join(jsonPath, file)));
};

export const tableApis = (tableName) => {
  const db = getDB(`${tableName}.json`);

  const read = async () => {
    await db.read();
    return db.data;
  };

  const readById = async (id) => {
    const table = await read();
    const data = table[id];
    if (!data) throw new Error(`[readById] - [${tableName}] failled, '${id}' not existed`);
    return data;
  };

  const validate = async (id) => {
    const table = await read();
    const data = table[id];
    return !!data;
  };

  const insert = async (id, data) => {
    if (!id) throw new Error(`[insert] to [${tableName}] failled, [id] is '${id}'`);
    if (await validate(id)) throw new Error(`[insert] - [${tableName}] failled, '${id}' existed`);

    const table = await read();
    table[id] = data;
    await db.write();
    return readById(id);
  };

  const update = async (id, data) => {
    if (!id) throw new Error(`[update] to [${tableName}] failled, [id] is '${id}'`);
    if (!(await validate(id)))
      throw new Error(`[update] - [${tableName}] failled, '${id}' not existed`);

    const table = await read();
    if (Array.isArray(data)) table[id] = [...(table[id] || []), ...data];
    else table[id] = { ...(table[id] || {}), ...data };
    await db.write();
    return readById(id);
  };

  const remove = async (id) => {
    if (!(await validate(id)))
      throw new Error(`[remove] - [${tableName}]: failled, '${id}' not existed`);

    const table = await read();
    delete table[id];
    await db.write();
  };

  return {
    read,
    readById,
    validate,
    insert,
    update,
    remove,
  };
};

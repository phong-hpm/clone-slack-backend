import { getDB } from "./index.js";

export const tableApis = (tableName) => {
  const db = getDB(`${tableName}.json`);

  const read = () => {
    db.read();
    return db.data;
  };

  const readById = (id) => {
    const data = read()[id];
    if (!data) throw new Error(`[readById] - [${tableName}] failled, '${id}' not existed`);
    return data;
  };

  const validate = (id) => {
    return !!read()[id];
  };

  const insert = (id, data) => {
    if (!id) throw new Error(`[insert] to [${tableName}] failled, [id] is '${id}'`);
    if (validate(id)) throw new Error(`[insert] - [${tableName}] failled, '${id}' existed`);

    const table = read();
    table[id] = data;
    db.write();
    return readById(id);
  };

  const update = (id, data) => {
    if (!id) throw new Error(`[update] to [${tableName}] failled, [id] is '${id}'`);
    if (!validate(id)) throw new Error(`[update] - [${tableName}] failled, '${id}' not existed`);

    const table = read();
    if (Array.isArray(data)) table[id] = [...(table[id] || []), ...data];
    else table[id] = { ...(table[id] || {}), ...data };
    db.write();
    return readById(id);
  };

  const remove = (id) => {
    if (!validate(id)) throw new Error(`[remove] - [${tableName}]: failled, '${id}' not existed`);

    const table = read();
    delete table[id];
    db.write();
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

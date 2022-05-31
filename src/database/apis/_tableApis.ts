import { Low, JSONFile } from "lowdb";
import { join } from "path";

const getDB = <DataType>(file: string) => {
  const jsonPath = `${process.cwd()}/src/database/json`;
  return new Low<Record<string, DataType>>(new JSONFile(join(jsonPath, file)));
};

export const tableApis = <DataType>(tableName: string) => {
  const jsonPath = `${process.cwd()}/src/database/json`;
  const db = new Low<Record<string, DataType>>(new JSONFile(join(jsonPath, `${tableName}.json`)));

  const read = async () => {
    await db.read();
    return db.data || {};
  };

  const find = async (searchObj: Partial<DataType>) => {
    const table = await read();
    let result: DataType = undefined;

    for (const item of Object.values(table)) {
      let matched = true;

      for (const field in searchObj) {
        if (item[field] === undefined || item[field] !== searchObj[field]) {
          matched = false;
          break;
        }
      }

      if (matched) {
        result = item;
        break;
      }
    }

    return result;
  };

  const write = async () => {
    await db.write();
  };

  const readById = async (id: string) => {
    const table = await read();
    const data = table[id];
    if (!data) throw new Error(`[readById] - [${tableName}] failled, '${id}' not existed`);
    return data;
  };

  const validate = async (id: string) => {
    const table = await read();
    const data = table[id];
    return !!data;
  };

  const insert = async (id: string, data: Partial<DataType>) => {
    if (!id) throw new Error(`[insert] to [${tableName}] failled, [id] is '${id}'`);
    if (await validate(id)) throw new Error(`[insert] - [${tableName}] failled, '${id}' existed`);

    const now = Date.now();
    const table = await read();
    if (Array.isArray(data)) {
      table[id] = data as unknown as DataType;
    } else {
      table[id] = {
        ...data,
        createdTime: (data as any).createdTime || now,
        updatedTime: (data as any).updatedTime || now,
      } as unknown as DataType;
    }
    await db.write();
    return readById(id);
  };

  const update = async (id: string, data: Partial<DataType>) => {
    if (!id) throw new Error(`[update] to [${tableName}] failled, [id] is '${id}'`);
    if (!(await validate(id)))
      throw new Error(`[update] - [${tableName}] failled, '${id}' not existed`);

    const now = Date.now();
    const table = await read();
    if (Array.isArray(data)) {
      table[id] = [
        ...((table as unknown as Record<string, DataType[]>)[id] || []),
        ...data,
      ] as unknown as DataType;
    } else {
      table[id] = {
        ...(table[id] || {}),
        ...data,
        updatedTime: (data as any).updatedTime || now,
      } as unknown as DataType;
    }
    await db.write();
    return readById(id);
  };

  const remove = async (id: string) => {
    if (!(await validate(id)))
      throw new Error(`[remove] - [${tableName}]: failled, '${id}' not existed`);

    const table = await read();
    delete table[id];
    await db.write();
  };

  return {
    read,
    find,
    write,
    readById,
    validate,
    insert,
    update,
    remove,
  };
};

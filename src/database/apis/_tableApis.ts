import { Low, JSONFile } from "lowdb";
import { join } from "path";

const domainRegExp = new RegExp(`^https://api.slack-clone.cf.+`);

// support for developlent
const updateUrlDomain = <T>(data: T) => {
  if (!data || typeof data !== "object") return data;

  let result: T;
  if (Array.isArray(data)) {
    result = data.map((item) => updateUrlDomain(item)) as unknown as T;
  } else {
    result = { ...data };
    const keys = Object.keys(data);

    keys.forEach((key) => {
      if (typeof result[key] === "object") {
        result[key] = updateUrlDomain(result[key]);
      } else if (domainRegExp.test(result[key])) {
        result[key] = result[key].replace("https://api.slack-clone.cf", "http://localhost:8081");
      }
    });
  }

  return result;
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

    if (process.env.NODE_ENV === "development") {
      return updateUrlDomain(result);
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

    if (process.env.NODE_ENV === "development") {
      return updateUrlDomain(data);
    }

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

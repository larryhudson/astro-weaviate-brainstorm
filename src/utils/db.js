import Database from "better-sqlite3";

// Connect to the SQLite database
const db = new Database("sqlite.db", { verbose: console.log });
db.pragma("journal_mode = WAL");

export function createRecord(table, data) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values.map(() => "?").join(", ");
  const statement = db.prepare(
    `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`,
  );
  const result = statement.run(values);
  return result.lastInsertRowid;
}

function parseId(id) {
  const parsedId = parseInt(id);

  if (Number.isNaN(parsedId)) {
    throw new Error("Invalid ID. Please provide a valid integer ID.");
  }

  return parsedId;
}

export function getRecordById(table, id) {
  const parsedId = parseId(id);

  const statement = db.prepare(`SELECT * FROM ${table} WHERE id = ?`);

  return statement.get(parsedId);
}

export function updateRecord(table, id, data) {
  const parsedId = parseId(id);

  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((key) => `${key} = ?`).join(", ");
  const statement = db.prepare(
    `UPDATE ${table} SET ${placeholders} WHERE id = ?`,
  );
  const result = statement.run([...values, parsedId]);
  return result.changes > 0;
}

export function executeQuery(table, condition, limit, offset) {
  let whereClause = "";
  let limitClause = "";
  let offsetClause = "";
  const values = [];

  if (condition) {
    const keys = Object.keys(condition);
    const conditions = keys.map((key) => {
      values.push(condition[key]);
      return `${key} = ?`;
    });

    whereClause = `WHERE ${conditions.join(" AND ")}`;
  }

  if (limit) {
    limitClause = `LIMIT ${limit}`;
  }

  if (offset) {
    offsetClause = `OFFSET ${offset}`;
  }

  const query =
    `SELECT * FROM ${table} ${whereClause} ${limitClause} ${offsetClause}`.trim();
  const statement = db.prepare(query);
  return statement.all(values);
}

export function deleteRecordById(table, id) {
  const parsedId = parseId(id);

  const statement = db.prepare(`DELETE FROM ${table} WHERE id = ?`);
  const result = statement.run(parsedId);
  return result.changes > 0;
}

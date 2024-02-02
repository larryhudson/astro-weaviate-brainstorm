import Database from "better-sqlite3";

const db = new Database("sqlite.db", { verbose: console.log });
db.pragma("journal_mode = WAL");

const createTableStatements = [
  `CREATE TABLE IF NOT EXISTS notes (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	title TEXT NOT NULL,
	body TEXT,
	status TEXT,
	processed_at DATE,
  progress INTEGER DEFAULT 0
	);`,
];

createTableStatements.forEach((statement) => {
  db.exec(statement);
});

db.close();

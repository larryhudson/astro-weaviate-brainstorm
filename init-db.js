import fs from "fs";
import Database from "better-sqlite3";

const db = new Database("sqlite.db", { verbose: console.log });
db.pragma("journal_mode = WAL");

// Check if tables exist
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

if (tables.length === 0) {
	// If tables do not exist, read SQL from init-schema.sql and execute it
	const initSchemaSql = fs.readFileSync('init-schema.sql', 'utf8');
	console.log("Initialising schema")
	db.exec(initSchemaSql);

	// Then read SQL from seed-data.sql and execute it
	const seedDataSql = fs.readFileSync('seed-data.sql', 'utf8');
	console.log("Inserting seed data")
	db.exec(seedDataSql);

	const tablesExist = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().length > 0;

	if (tablesExist) {
		console.log("Tables have been created.");
	}
}


db.close();

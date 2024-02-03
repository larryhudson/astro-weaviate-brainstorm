-- This is SQL to initialise the SQLite database

-- Create table for brainstorms if it doesn't exist
CREATE TABLE IF NOT EXISTS brainstorms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')) NOT NULL,
    summary TEXT
);

-- Create table for brainstorm messages - brainstorm ID, type (user/assistant), message, created_at 
CREATE TABLE IF NOT EXISTS brainstorm_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brainstorm_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now', 'localtime')) NOT NULL,
  FOREIGN KEY (brainstorm_id) REFERENCES brainstorms(id)
);


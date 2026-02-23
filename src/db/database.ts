import Database from 'better-sqlite3';

const db = new Database('quotes.db');

export function isDbSeeded() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM quotes');
  const result = stmt.get() as { count: number };
  return result.count > 0;
}

export function initializeDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote TEXT NOT NULL,
      category_id INTEGER,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS generated_quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER,
      generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quote_id) REFERENCES quotes(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS seen_quotes (
      quote_id INTEGER PRIMARY KEY,
      seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quote_id) REFERENCES quotes(id)
    );
  `);

  console.log('Database initialized.');
}

export default db;

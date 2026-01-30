import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'price-monitor.db');
const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT UNIQUE NOT NULL,
    handle TEXT NOT NULL,
    store_domain TEXT NOT NULL,
    title TEXT,
    image_url TEXT,
    original_price INTEGER,
    current_price INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export interface Item {
  id: number;
  url: string;
  handle: string;
  store_domain: string;
  title: string | null;
  image_url: string | null;
  original_price: number | null;
  current_price: number | null;
  created_at: string;
  updated_at: string;
}

export function getAllItems(): Item[] {
  const stmt = db.prepare('SELECT * FROM items ORDER BY created_at DESC');
  return stmt.all() as Item[];
}

export function getItemById(id: number): Item | undefined {
  const stmt = db.prepare('SELECT * FROM items WHERE id = ?');
  return stmt.get(id) as Item | undefined;
}

export function addItem(item: {
  url: string;
  handle: string;
  store_domain: string;
  title: string;
  image_url: string;
  original_price: number;
  current_price: number;
}): Item {
  const stmt = db.prepare(`
    INSERT INTO items (url, handle, store_domain, title, image_url, original_price, current_price)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    item.url,
    item.handle,
    item.store_domain,
    item.title,
    item.image_url,
    item.original_price,
    item.current_price
  );
  return getItemById(result.lastInsertRowid as number)!;
}

export function updateItemPrice(id: number, currentPrice: number): void {
  const stmt = db.prepare(`
    UPDATE items
    SET current_price = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(currentPrice, id);
}

export function deleteItem(id: number): void {
  const stmt = db.prepare('DELETE FROM items WHERE id = ?');
  stmt.run(id);
}

export default db;

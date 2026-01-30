import { neon, NeonQueryFunction } from '@neondatabase/serverless';

let sql: NeonQueryFunction<false, false>;

function getDb() {
  if (!sql) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL or POSTGRES_URL environment variable is required');
    }
    sql = neon(connectionString);
  }
  return sql;
}

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

// Initialize database schema
export async function initDb() {
  const db = getDb();
  await db`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      url TEXT UNIQUE NOT NULL,
      handle TEXT NOT NULL,
      store_domain TEXT NOT NULL,
      title TEXT,
      image_url TEXT,
      original_price INTEGER,
      current_price INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

export async function getAllItems(): Promise<Item[]> {
  const db = getDb();
  const rows = await db`SELECT * FROM items ORDER BY created_at DESC`;
  return rows as Item[];
}

export async function getItemById(id: number): Promise<Item | undefined> {
  const db = getDb();
  const rows = await db`SELECT * FROM items WHERE id = ${id}`;
  return rows[0] as Item | undefined;
}

export async function addItem(item: {
  url: string;
  handle: string;
  store_domain: string;
  title: string;
  image_url: string;
  original_price: number;
  current_price: number;
}): Promise<Item> {
  const db = getDb();
  const rows = await db`
    INSERT INTO items (url, handle, store_domain, title, image_url, original_price, current_price)
    VALUES (${item.url}, ${item.handle}, ${item.store_domain}, ${item.title}, ${item.image_url}, ${item.original_price}, ${item.current_price})
    RETURNING *
  `;
  return rows[0] as Item;
}

export async function updateItemPrice(id: number, currentPrice: number): Promise<void> {
  const db = getDb();
  await db`
    UPDATE items
    SET current_price = ${currentPrice}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `;
}

export async function deleteItem(id: number): Promise<void> {
  const db = getDb();
  await db`DELETE FROM items WHERE id = ${id}`;
}

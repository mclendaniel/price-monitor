import { sql } from '@vercel/postgres';

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
  await sql`
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
  const { rows } = await sql<Item>`SELECT * FROM items ORDER BY created_at DESC`;
  return rows;
}

export async function getItemById(id: number): Promise<Item | undefined> {
  const { rows } = await sql<Item>`SELECT * FROM items WHERE id = ${id}`;
  return rows[0];
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
  const { rows } = await sql<Item>`
    INSERT INTO items (url, handle, store_domain, title, image_url, original_price, current_price)
    VALUES (${item.url}, ${item.handle}, ${item.store_domain}, ${item.title}, ${item.image_url}, ${item.original_price}, ${item.current_price})
    RETURNING *
  `;
  return rows[0];
}

export async function updateItemPrice(id: number, currentPrice: number): Promise<void> {
  await sql`
    UPDATE items
    SET current_price = ${currentPrice}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `;
}

export async function deleteItem(id: number): Promise<void> {
  await sql`DELETE FROM items WHERE id = ${id}`;
}

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export interface Item {
  id: number;
  url: string;
  handle: string;
  store_domain: string;
  title: string | null;
  image_url: string | null;
  original_price: number | null;
  current_price: number | null;
  created_at: Date;
  updated_at: Date;
}

export async function initDb() {
  // Prisma handles migrations, no need to create tables manually
}

export async function getAllItems(): Promise<Item[]> {
  const items = await prisma.item.findMany({
    orderBy: { created_at: 'desc' }
  });
  return items as Item[];
}

export async function getItemById(id: number): Promise<Item | undefined> {
  const item = await prisma.item.findUnique({
    where: { id }
  });
  return item as Item | undefined;
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
  const created = await prisma.item.create({
    data: {
      url: item.url,
      handle: item.handle,
      store_domain: item.store_domain,
      title: item.title,
      image_url: item.image_url,
      original_price: item.original_price,
      current_price: item.current_price,
    }
  });
  return created as Item;
}

export async function updateItemPrice(id: number, currentPrice: number): Promise<void> {
  await prisma.item.update({
    where: { id },
    data: { current_price: currentPrice }
  });
}

export async function deleteItem(id: number): Promise<void> {
  await prisma.item.delete({
    where: { id }
  });
}

export async function getSetting(key: string): Promise<string | null> {
  const setting = await prisma.settings.findUnique({
    where: { key }
  });
  return setting?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.settings.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
}

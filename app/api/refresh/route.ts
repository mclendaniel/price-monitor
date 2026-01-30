import { NextResponse } from 'next/server';
import { getAllItems, updateItemPrice, initDb } from '@/lib/db';
import { fetchCurrentPrice } from '@/lib/scraper';

export async function POST() {
  try {
    await initDb();
    const items = await getAllItems();
    const results: { id: number; success: boolean; error?: string }[] = [];

    // Fetch current prices for all items
    await Promise.all(
      items.map(async (item) => {
        try {
          const currentPrice = await fetchCurrentPrice(item.store_domain, item.handle);
          await updateItemPrice(item.id, currentPrice);
          results.push({ id: item.id, success: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          results.push({ id: item.id, success: false, error: message });
        }
      })
    );

    // Return updated items
    const updatedItems = await getAllItems();

    return NextResponse.json({
      items: updatedItems,
      results,
    });
  } catch (error) {
    console.error('Error refreshing prices:', error);
    return NextResponse.json(
      { error: 'Failed to refresh prices' },
      { status: 500 }
    );
  }
}

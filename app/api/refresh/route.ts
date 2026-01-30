import { NextRequest, NextResponse } from 'next/server';
import { getAllItems, updateItemPrice, initDb } from '@/lib/db';
import { fetchCurrentPrice } from '@/lib/scraper';

async function refreshPrices() {
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

  return { items: updatedItems, results };
}

// GET handler for Vercel Cron
export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await refreshPrices();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error refreshing prices (cron):', error);
    return NextResponse.json(
      { error: 'Failed to refresh prices' },
      { status: 500 }
    );
  }
}

// POST handler for manual refresh from UI
export async function POST() {
  try {
    const data = await refreshPrices();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error refreshing prices:', error);
    return NextResponse.json(
      { error: 'Failed to refresh prices' },
      { status: 500 }
    );
  }
}

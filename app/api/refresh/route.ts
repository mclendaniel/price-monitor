import { NextRequest, NextResponse } from 'next/server';
import { getAllItems, updateItemPrice, updateNotifiedPrice, initDb, getSetting } from '@/lib/db';
import { fetchCurrentPrice } from '@/lib/scraper';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface PriceDrop {
  id: number;
  title: string;
  oldPrice: number;
  newPrice: number;
  url: string;
  percentOff: number;
}

async function sendPriceDropEmail(drops: PriceDrop[], email: string) {
  if (!resend || drops.length === 0) return;

  const itemsList = drops.map(d =>
    `• ${d.title}\n  Was: $${(d.oldPrice / 100).toFixed(2)} → Now: $${(d.newPrice / 100).toFixed(2)} (${d.percentOff}% off)\n  ${d.url}`
  ).join('\n\n');

  await resend.emails.send({
    from: 'Price Monitor <onboarding@resend.dev>',
    to: email,
    subject: `🔔 Price Drop Alert: ${drops.length} item${drops.length > 1 ? 's' : ''} dropped!`,
    text: `Good news! The following items have dropped in price:\n\n${itemsList}`,
  });
}

async function refreshPrices() {
  await initDb();
  const items = await getAllItems();
  const results: { id: number; success: boolean; error?: string }[] = [];
  const priceDrops: PriceDrop[] = [];

  // Fetch current prices for all items
  await Promise.all(
    items.map(async (item) => {
      try {
        const newPrice = await fetchCurrentPrice(item.store_domain, item.handle);
        const originalPrice = item.original_price;
        const notifiedPrice = item.notified_price;

        // Check for price drop: below original AND (never notified OR lower than last notified)
        if (originalPrice && newPrice < originalPrice) {
          if (notifiedPrice === null || newPrice < notifiedPrice) {
            const percentOff = Math.round((1 - newPrice / originalPrice) * 100);
            priceDrops.push({
              id: item.id,
              title: item.title || 'Unknown Item',
              oldPrice: originalPrice,
              newPrice,
              url: item.url,
              percentOff,
            });
          }
        }

        await updateItemPrice(item.id, newPrice);
        results.push({ id: item.id, success: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.push({ id: item.id, success: false, error: message });
      }
    })
  );

  // Send email if there are price drops
  console.log('Price drops detected:', priceDrops.length);
  if (priceDrops.length > 0) {
    const alertEmail = await getSetting('alert_email');
    console.log('Alert email from DB:', alertEmail);
    console.log('Resend configured:', !!resend);
    if (alertEmail) {
      try {
        await sendPriceDropEmail(priceDrops, alertEmail);
        console.log('Email sent successfully');
        // Update notified prices so we don't email again for same price
        await Promise.all(
          priceDrops.map(drop => updateNotifiedPrice(drop.id, drop.newPrice))
        );
      } catch (error) {
        console.error('Failed to send price drop email:', error);
      }
    }
  }

  // Return updated items
  const updatedItems = await getAllItems();

  return { items: updatedItems, results, priceDrops: priceDrops.length };
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

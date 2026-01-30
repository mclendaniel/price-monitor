import { NextRequest, NextResponse } from 'next/server';
import { getAllItems, addItem } from '@/lib/db';
import { fetchProductData } from '@/lib/scraper';

export async function GET() {
  try {
    const items = getAllItems();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Fetch product data from Shopify
    const productData = await fetchProductData(url);

    // Add to database
    const item = addItem({
      url,
      handle: productData.handle,
      store_domain: productData.store_domain,
      title: productData.title,
      image_url: productData.image_url,
      original_price: productData.price,
      current_price: productData.price,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error adding item:', error);
    const message = error instanceof Error ? error.message : 'Failed to add item';

    // Check for unique constraint violation
    if (message.includes('UNIQUE constraint')) {
      return NextResponse.json(
        { error: 'This product is already being monitored' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

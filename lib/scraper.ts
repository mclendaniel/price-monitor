export interface ProductData {
  handle: string;
  store_domain: string;
  title: string;
  image_url: string;
  price: number; // in cents
}

// Custom store scrapers - add new stores here
const CUSTOM_STORES: Record<string, (url: string, domain: string, handle: string) => Promise<ProductData>> = {
  'www.buckmason.com': fetchBuckMasonProduct,
  'buckmason.com': fetchBuckMasonProduct,
};

export function parseProductUrl(url: string): { domain: string; handle: string | null } | null {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname;

    // Try to extract product handle from /products/some-product-name URL
    const pathMatch = parsed.pathname.match(/\/products\/([^/?]+)/);
    const handle = pathMatch ? pathMatch[1] : null;

    return { domain, handle };
  } catch {
    return null;
  }
}

export function getStoreName(domain: string): string {
  // Known stores get friendly names
  if (domain.includes('toddsnyder')) return 'Todd Snyder';
  if (domain.includes('brut')) return 'BRUT';
  if (domain.includes('percival')) return 'Percival';
  if (domain.includes('buckmason')) return 'Buck Mason';
  // For unknown stores, clean up the domain name
  return domain.replace('www.', '').split('.')[0];
}

// Helper to extract meta tag content from HTML
function extractMetaContent(html: string, property: string): string | null {
  // Try property attribute (Open Graph style)
  const propertyMatch = html.match(new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'));
  if (propertyMatch) return propertyMatch[1];

  // Try content before property
  const reverseMatch = html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`, 'i'));
  if (reverseMatch) return reverseMatch[1];

  // Try name attribute
  const nameMatch = html.match(new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'));
  if (nameMatch) return nameMatch[1];

  return null;
}

// Buck Mason scraper using Open Graph meta tags
async function fetchBuckMasonProduct(url: string, domain: string, handle: string): Promise<ProductData> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html',
    },
  });

  if (!response.ok) {
    throw new Error('Could not fetch Buck Mason product');
  }

  const html = await response.text();

  // Extract from Open Graph meta tags
  const priceStr = extractMetaContent(html, 'product:price:amount') || extractMetaContent(html, 'og:price:amount');
  const title = extractMetaContent(html, 'og:title');
  const image = extractMetaContent(html, 'og:image');

  if (!priceStr || !title) {
    throw new Error('Could not parse Buck Mason product data');
  }

  // Clean up title (remove " - Buck Mason- Modern American Classics" suffix)
  const cleanTitle = title.replace(/\s*-\s*Buck Mason.*$/i, '').trim();

  // Price is in dollars, convert to cents
  const price = Math.round(parseFloat(priceStr) * 100);

  return {
    handle,
    store_domain: domain,
    title: cleanTitle,
    image_url: image || '',
    price,
  };
}

// Check if a store has a custom scraper
function getCustomScraper(domain: string) {
  return CUSTOM_STORES[domain] || CUSTOM_STORES[domain.replace('www.', '')] || null;
}

export async function fetchProductData(url: string): Promise<ProductData> {
  const parsed = parseProductUrl(url);
  if (!parsed) {
    throw new Error('Invalid URL format.');
  }

  const { domain, handle } = parsed;

  // If URL doesn't have /products/ path, it's not supported
  if (!handle) {
    throw new Error('This store is not supported');
  }

  // Check for custom scraper first
  const customScraper = getCustomScraper(domain);
  if (customScraper) {
    return customScraper(url, domain, handle);
  }

  // Default: try Shopify JSON API
  const jsonUrl = `https://${domain}/products/${handle}.json`;

  let response;
  try {
    response = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });
  } catch {
    throw new Error(`Could not connect to ${domain}.`);
  }

  if (!response.ok) {
    throw new Error('This store is not supported');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('This store is not supported');
  }

  const product = data.product;
  if (!product) {
    throw new Error('This store is not supported');
  }

  // Get price from first available variant
  const variant = product.variants?.[0];
  if (!variant) {
    throw new Error('No product variants found.');
  }

  // Price comes as string like "129.00", convert to cents
  const priceString = variant.price || '0';
  const price = Math.round(parseFloat(priceString) * 100);

  // Get first image
  const imageUrl = product.images?.[0]?.src || product.image?.src || '';

  return {
    handle,
    store_domain: domain,
    title: product.title || 'Unknown Product',
    image_url: imageUrl,
    price,
  };
}

export async function fetchCurrentPrice(domain: string, handle: string): Promise<number> {
  // Check for custom scraper
  const customScraper = getCustomScraper(domain);
  if (customScraper) {
    const url = `https://${domain}/products/${handle}`;
    const product = await customScraper(url, domain, handle);
    return product.price;
  }

  // Default: Shopify JSON API
  const jsonUrl = `https://${domain}/products/${handle}.json`;

  const response = await fetch(jsonUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch product: ${response.status}`);
  }

  const data = await response.json();
  const variant = data.product?.variants?.[0];

  if (!variant) {
    throw new Error('No product variants found');
  }

  const priceString = variant.price || '0';
  return Math.round(parseFloat(priceString) * 100);
}

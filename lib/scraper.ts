export interface ProductData {
  handle: string;
  store_domain: string;
  title: string;
  image_url: string;
  price: number; // in cents
}

export function parseProductUrl(url: string): { domain: string; handle: string | null } | null {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname;

    // Try to extract product handle from Shopify-style URL: /products/some-product-name
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
  // For unknown stores, clean up the domain name
  return domain.replace('www.', '').split('.')[0];
}

export async function fetchProductData(url: string): Promise<ProductData> {
  const parsed = parseProductUrl(url);
  if (!parsed) {
    throw new Error('Invalid URL format.');
  }

  const { domain, handle } = parsed;

  // If URL doesn't have /products/ path, it's not a Shopify product URL
  if (!handle) {
    throw new Error(`This doesn't appear to be a Shopify store. Only Shopify stores are supported (URL should contain /products/).`);
  }

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
    if (response.status === 404) {
      throw new Error(`Product not found, or ${domain} is not a Shopify store.`);
    }
    throw new Error(`${domain} is not a Shopify store (or is blocking requests).`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`${domain} is not a Shopify store.`);
  }

  const product = data.product;
  if (!product) {
    throw new Error(`${domain} is not a Shopify store.`);
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

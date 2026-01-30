'use client';

import { useState } from 'react';
import { Item } from '@/lib/db';

interface ItemCardProps {
  item: Item;
  onDelete: () => void;
}

function formatPrice(cents: number | null): string {
  if (cents === null) return '--';
  return `$${(cents / 100).toFixed(2)}`;
}

function getStoreName(domain: string): string {
  // Known stores get friendly names
  if (domain.includes('toddsnyder')) return 'Todd Snyder';
  if (domain.includes('brut')) return 'BRUT';
  if (domain.includes('percival')) return 'Percival';
  // Clean up unknown domains for display
  return domain.replace('www.', '').split('.')[0];
}

function getStoreBadgeColor(domain: string): string {
  if (domain.includes('toddsnyder')) return 'bg-slate-800';
  if (domain.includes('brut')) return 'bg-amber-700';
  if (domain.includes('percival')) return 'bg-emerald-700';
  // Generate a consistent color for unknown stores based on domain
  const colors = ['bg-indigo-600', 'bg-purple-600', 'bg-pink-600', 'bg-teal-600', 'bg-cyan-600'];
  const hash = domain.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export default function ItemCard({ item, onDelete }: ItemCardProps) {
  const [deleting, setDeleting] = useState(false);
  const originalPrice = item.original_price ?? 0;
  const currentPrice = item.current_price ?? 0;
  const priceDiff = currentPrice - originalPrice;
  const percentChange = originalPrice > 0 ? ((priceDiff / originalPrice) * 100) : 0;

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/items/${item.id}`, { method: 'DELETE' });
      if (response.ok) {
        onDelete();
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow relative group">
      {/* Product Image */}
      <div className="aspect-square relative bg-gray-100">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title || 'Product'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
        {/* Store Badge */}
        <span
          className={`absolute top-3 left-3 px-2 py-1 text-xs font-medium text-white rounded ${getStoreBadgeColor(item.store_domain)}`}
        >
          {getStoreName(item.store_domain)}
        </span>
        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="absolute top-3 right-3 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity disabled:opacity-50"
          title="Remove item"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* Percent Change Badge */}
        <span
          className={`absolute bottom-3 right-3 px-2 py-1 text-xs font-bold rounded ${
            percentChange < 0
              ? 'bg-green-500 text-white'
              : percentChange > 0
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          {percentChange === 0 ? '0%' : `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(0)}%`}
        </span>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 line-clamp-2 mb-3" title={item.title || undefined}>
          {item.title || 'Unknown Product'}
        </h3>

        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-sm text-gray-500">Original: </span>
            <span className="text-sm text-gray-700">{formatPrice(originalPrice)}</span>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-500">Current: </span>
            <span
              className={`text-lg font-semibold ${
                priceDiff < 0
                  ? 'text-green-600'
                  : priceDiff > 0
                  ? 'text-red-600'
                  : 'text-gray-900'
              }`}
            >
              {formatPrice(currentPrice)}
            </span>
          </div>
        </div>

        {/* Link to Product */}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          View Product →
        </a>
      </div>
    </div>
  );
}

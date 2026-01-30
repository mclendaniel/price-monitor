'use client';

import { Item } from '@/lib/db';
import ItemCard from './ItemCard';

interface GalleryProps {
  items: Item[];
  onRefresh: () => void;
  onItemDeleted: () => void;
  refreshing: boolean;
}

export default function Gallery({ items, onRefresh, onItemDeleted, refreshing }: GalleryProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🛍️</div>
        <h2 className="text-xl font-medium text-gray-700 mb-2">No items yet</h2>
        <p className="text-gray-500">
          Add a product URL above to start monitoring prices
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-700">
          Monitoring {items.length} item{items.length !== 1 ? 's' : ''}
        </h2>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <svg
            className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {refreshing ? 'Refreshing...' : 'Refresh Prices'}
        </button>
      </div>

      {/* Grid of Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} onDelete={onItemDeleted} />
        ))}
      </div>
    </div>
  );
}

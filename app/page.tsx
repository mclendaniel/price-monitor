'use client';

import { useState, useEffect, useCallback } from 'react';
import AddItemForm from '@/components/AddItemForm';
import Gallery from '@/components/Gallery';
import { Item } from '@/lib/db';

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch('/api/items');
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/refresh', { method: 'POST' });
      const data = await response.json();
      if (data.items) {
        setItems(data.items);
      }
    } catch (error) {
      console.error('Failed to refresh prices:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Price Monitor</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track prices from any Shopify store
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Item Form */}
        <div className="mb-8">
          <AddItemForm onItemAdded={fetchItems} />
        </div>

        {/* Gallery */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading items...</p>
          </div>
        ) : (
          <Gallery items={items} onRefresh={handleRefresh} onItemDeleted={fetchItems} refreshing={refreshing} />
        )}
      </main>
    </div>
  );
}

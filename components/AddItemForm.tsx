'use client';

import { useState } from 'react';

interface AddItemFormProps {
  onItemAdded: () => void;
}

export default function AddItemForm({ onItemAdded }: AddItemFormProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    // Auto-add https:// if missing
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add item');
      }

      setUrl('');
      onItemAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="flex gap-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste any Shopify product URL (e.g. toddsnyder.com/products/...)"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Adding...' : 'Add Item'}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-red-600 text-sm">{error}</p>
      )}
    </form>
  );
}

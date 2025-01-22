'use client';
import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState(new Set());

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setProducts([]);
    
    const url = e.target.elements[0].value;
    
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      setProducts(data.products);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const toggleProduct = (index) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">Product Scraper</h1>
          <p className="text-gray-600 dark:text-gray-300">Enter a URL to fetch all products from the page</p>
        </div>
        
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-12">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="url"
              placeholder="https://example.com/products"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                       transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? 'Scanning...' : 'Find Products'}
            </button>
          </div>
        </form>

        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        {products.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Found {products.length} Products
              </h2>
              <button
                onClick={() => {/* Handle export of selected products */}}
                disabled={selectedProducts.size === 0}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg
                         transition-colors duration-200 disabled:opacity-50"
              >
                Export Selected ({selectedProducts.size})
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => (
                <div
                  key={index}
                  onClick={() => toggleProduct(index)}
                  className={`
                    cursor-pointer p-4 rounded-lg border-2 transition-all
                    ${selectedProducts.has(index)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    }
                    hover:shadow-lg
                  `}
                >
                  {product.image && (
                    <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {product.title || 'Untitled Product'}
                  </h3>
                  {product.price && (
                    <p className="text-blue-600 dark:text-blue-400 font-medium">
                      {product.price}
                    </p>
                  )}
                  {product.link && (
                    <a
                      href={product.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline mt-2 block"
                      onClick={e => e.stopPropagation()}
                    >
                      View Original →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { fetchProducts, fetchCategories } from '../api/products';
import { extractErrorMessage } from '../api/client';
import ProductCard from '../components/ProductCard';
import { Spinner, ErrorBanner, EmptyState } from '../components/Feedback';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [productData, categoryData] = await Promise.all([fetchProducts(), fetchCategories()]);
      setProducts(productData);
      setCategories(categoryData);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load products.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const visibleProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter((p) => p.category?.id === activeCategory);
  }, [products, activeCategory]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-10 max-w-xl">
        <h1 className="text-4xl mb-3">Everyday goods, chosen carefully</h1>
        <p className="text-ink/60">
          A small catalog of things worth keeping around — browse by category or see everything at once.
        </p>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-line">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3.5 py-1.5 text-sm border transition-colors ${
              activeCategory === 'all'
                ? 'bg-ink text-paper border-ink'
                : 'border-line text-ink/70 hover:border-ink'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 text-sm border transition-colors ${
                activeCategory === cat.id
                  ? 'bg-ink text-paper border-ink'
                  : 'border-line text-ink/70 hover:border-ink'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {error && <div className="mb-6"><ErrorBanner message={error} onRetry={loadData} /></div>}

      {loading ? (
        <Spinner label="Loading products…" />
      ) : visibleProducts.length === 0 ? (
        <EmptyState
          title="No products here yet"
          description="Check back soon, or try a different category."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

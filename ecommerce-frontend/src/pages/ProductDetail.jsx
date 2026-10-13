import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProduct } from '../api/products';
import { extractErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatMoney } from '../utils/format';
import { Spinner, ErrorBanner } from '../components/Feedback';
import { StarRating } from '../components/StarRating';
import Reviews from '../components/Reviews';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [addState, setAddState] = useState('idle'); // idle | adding | added | error
  const [addError, setAddError] = useState(null);

  // `silent` refreshes the product (for the rating summary) without swapping the
  // whole page for a spinner, and without replacing it with an error banner if
  // the refresh fails.
  async function load({ silent = false } = {}) {
    if (!silent) setLoading(true);
    if (!silent) setLoadError(null);
    try {
      const data = await fetchProduct(id);
      setProduct(data);
    } catch (err) {
      if (!silent) setLoadError(extractErrorMessage(err, 'Could not load this product.'));
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAddToCart() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${id}` } } });
      return;
    }
    setAddState('adding');
    setAddError(null);
    try {
      await addItem(product.id);
      setAddState('added');
      setTimeout(() => setAddState('idle'), 2000);
    } catch (err) {
      setAddState('error');
      setAddError(err.message);
    }
  }

  if (loading) return <Spinner label="Loading product…" />;
  if (loadError) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <ErrorBanner message={loadError} onRetry={() => load()} />
      </div>
    );
  }
  if (!product) return null;

  const outOfStock = product.stock_message === 'Out of Stock';
  const hasRating = product.review_count > 0 && typeof product.average_rating === 'number';

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="grid md:grid-cols-2 gap-12">
        <div className="aspect-[4/5] bg-surface border border-line overflow-hidden">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink/30 text-sm">
              No image
            </div>
          )}
        </div>

        <div className="max-w-md">
          {product.category?.name && (
            <p className="text-ink/50 text-sm mb-2">{product.category.name}</p>
          )}
          <h1 className="text-3xl mb-3">{product.name}</h1>

          {hasRating && (
            <div className="flex items-center gap-2 mb-4 text-sm text-ink/60">
              <StarRating value={product.average_rating} />
              <span>
                {product.average_rating.toFixed(1)} · {product.review_count}{' '}
                {product.review_count === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          )}

          <p className="text-xl font-medium mb-2">{formatMoney(product.dynamic_price)}</p>
          <p className="text-sm text-ink/60 mb-6">{product.stock_message}</p>

          {product.description && (
            <p className="text-ink/70 leading-relaxed mb-8">{product.description}</p>
          )}

          {addError && <div className="mb-4"><ErrorBanner message={addError} /></div>}

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addState === 'adding' || outOfStock}
            className="btn-primary w-full sm:w-auto"
          >
            {addState === 'adding' ? 'Adding…' : addState === 'added' ? 'Added to cart' : 'Add to cart'}
          </button>
        </div>
      </div>

      <Reviews productId={product.id} onChanged={() => load({ silent: true })} />
    </div>
  );
}
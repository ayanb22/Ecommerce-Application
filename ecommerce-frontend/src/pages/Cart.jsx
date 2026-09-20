import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { formatMoney, toNumber } from '../utils/format';
import { Spinner, ErrorBanner, EmptyState } from '../components/Feedback';

export default function Cart() {
  const { cart, loading, error, updateItem, removeItem, refreshCart } = useCart();
  const [busyItemId, setBusyItemId] = useState(null);
  const [actionError, setActionError] = useState(null);

  async function handleQuantityChange(item, nextQuantity) {
    if (nextQuantity < 1) return;
    setBusyItemId(item.id);
    setActionError(null);
    try {
      await updateItem(item.id, nextQuantity);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleRemove(item) {
    setBusyItemId(item.id);
    setActionError(null);
    try {
      await removeItem(item.product);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyItemId(null);
    }
  }

  if (loading && !cart) return <Spinner label="Loading your cart…" />;

  if (error && !cart) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <ErrorBanner message={error} onRetry={refreshCart} />
      </div>
    );
  }

  const items = cart?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <EmptyState
          title="Your cart is empty"
          description="Nothing here yet — go find something worth adding."
          action={
            <Link to="/" className="btn-primary">
              Browse products
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-3xl mb-8">Your cart</h1>

      {actionError && <div className="mb-6"><ErrorBanner message={actionError} /></div>}

      <div className="divide-y divide-line border-t border-b border-line">
        {items.map((item) => {
          const lineTotal = toNumber(item.product_price) * item.quantity;
          const isBusy = busyItemId === item.id;
          return (
            <div key={item.id} className="flex gap-4 py-5">
              <div className="w-20 h-20 bg-surface border border-line shrink-0 overflow-hidden">
                {item.product_image ? (
                  <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink/30 text-xs">
                    No image
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-4">
                  <h3 className="font-display text-lg truncate">{item.product_name}</h3>
                  <span className="font-medium shrink-0">{formatMoney(lineTotal)}</span>
                </div>
                <p className="text-ink/50 text-sm mb-3">{formatMoney(item.product_price)} each</p>

                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-line">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item, item.quantity - 1)}
                      disabled={isBusy || item.quantity <= 1}
                      className="w-8 h-8 flex items-center justify-center hover:bg-surface disabled:opacity-30 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item, item.quantity + 1)}
                      disabled={isBusy}
                      className="w-8 h-8 flex items-center justify-center hover:bg-surface disabled:opacity-30 transition-colors"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(item)}
                    disabled={isBusy}
                    className="text-sm text-ink/50 hover:text-clay transition-colors disabled:opacity-30"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center mt-8 pt-6">
        <span className="text-ink/60">Total</span>
        <span className="text-2xl font-medium">{formatMoney(cart.total)}</span>
      </div>

      <Link to="/checkout" className="btn-primary w-full text-center block mt-6">
        Proceed to checkout
      </Link>
    </div>
  );
}

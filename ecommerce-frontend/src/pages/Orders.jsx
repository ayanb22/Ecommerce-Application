import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrders, cancelOrder } from '../api/orders';
import { extractErrorMessage } from '../api/client';
import { formatMoney } from '../utils/format';
import { Spinner, ErrorBanner, EmptyState } from '../components/Feedback';

function StatusBadge({ status }) {
  const isCancelled = status === 'cancelled';
  return (
    <span
      className={`text-xs px-2.5 py-1 border ${
        isCancelled ? 'border-clay/40 text-clay' : 'border-moss-500/40 text-moss-500'
      }`}
    >
      {isCancelled ? 'Cancelled' : 'Pending'}
    </span>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [actionError, setActionError] = useState(null);
  // 'active' hides cancelled orders by default; 'all' shows everything.
  const [filter, setFilter] = useState('active');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load your orders.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCancel(orderId) {
    setCancellingId(orderId);
    setActionError(null);
    try {
      await cancelOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
      );
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Could not cancel that order.'));
    } finally {
      setCancellingId(null);
      setConfirmingId(null);
    }
  }

  const visibleOrders = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((o) => o.status !== 'cancelled');
  }, [orders, filter]);

  const cancelledCount = useMemo(
    () => orders.filter((o) => o.status === 'cancelled').length,
    [orders]
  );

  if (loading) return <Spinner label="Loading your orders…" />;

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <ErrorBanner message={error} onRetry={load} />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <EmptyState
          title="No orders yet"
          description="Once you place an order, it'll show up here."
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
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-3xl">Your orders</h1>

        {cancelledCount > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilter('active')}
              className={`px-3.5 py-1.5 text-sm border transition-colors ${
                filter === 'active'
                  ? 'bg-ink text-paper border-ink'
                  : 'border-line text-ink/70 hover:border-ink'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 text-sm border transition-colors ${
                filter === 'all'
                  ? 'bg-ink text-paper border-ink'
                  : 'border-line text-ink/70 hover:border-ink'
              }`}
            >
              All ({orders.length})
            </button>
          </div>
        )}
      </div>

      {actionError && <div className="mb-6"><ErrorBanner message={actionError} /></div>}

      {visibleOrders.length === 0 ? (
        <EmptyState
          title="No active orders"
          description={'All your orders are cancelled. Switch to "All" to see them.'}
        />
      ) : (
        <div className="space-y-8">
          {visibleOrders.map((order) => (
            <div key={order.id} className="border border-line">
              <div className="flex items-center justify-between px-5 py-4 border-b border-line">
                <div>
                  <p className="font-display text-lg">Order #{order.id}</p>
                  <p className="text-ink/50 text-sm">
                    {new Date(order.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="divide-y divide-line">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 px-5 py-4">
                    <div className="w-14 h-14 bg-surface border border-line shrink-0 overflow-hidden">
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink/30 text-xs">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate">{item.product_name}</p>
                        <p className="text-ink/50 text-sm">Qty {item.quantity}</p>
                      </div>
                      <span className="shrink-0">{formatMoney(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between px-5 py-4 border-t border-line">
                <span className="font-medium">{formatMoney(order.total)}</span>

                {order.status !== 'cancelled' && (
                  confirmingId === order.id ? (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-ink/60">Cancel this order?</span>
                      <button
                        type="button"
                        onClick={() => handleCancel(order.id)}
                        disabled={cancellingId === order.id}
                        className="text-clay hover:underline"
                      >
                        {cancellingId === order.id ? 'Cancelling…' : 'Yes, cancel'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="text-ink/50 hover:underline"
                      >
                        Never mind
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(order.id)}
                      className="text-sm text-ink/60 hover:text-clay transition-colors"
                    >
                      Cancel order
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import { Link, Navigate, useLocation } from 'react-router-dom';
import { formatMoney } from '../utils/format';

export default function OrderConfirmation() {
  const location = useLocation();
  const { orderId, total } = location.state || {};

  // Guard against someone navigating here directly (bookmark, refresh) —
  // there's no order data to show without having just completed checkout.
  if (!orderId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-20 text-center">
      <div className="w-12 h-12 rounded-full bg-moss-500 text-paper flex items-center justify-center mx-auto mb-6">
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" aria-hidden="true">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="text-2xl mb-2">Order placed</h1>
      <p className="text-ink/60 mb-8">
        Order #{orderId} is confirmed — total {formatMoney(total)}.
      </p>
      <Link to="/" className="btn-primary">
        Continue shopping
      </Link>
    </div>
  );
}

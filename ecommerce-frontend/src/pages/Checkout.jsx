import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder } from '../api/orders';
import { extractErrorMessage } from '../api/client';
import { formatMoney } from '../utils/format';
import { ErrorBanner } from '../components/Feedback';

const PAYMENT_METHODS = ['Cash on Delivery', 'Credit / Debit Card', 'UPI'];

export default function Checkout() {
  const { cart, refreshCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    paymentMethod: PAYMENT_METHODS[0],
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  // If someone lands here with an empty cart (direct link, refresh after
  // checkout, etc.) there's nothing to check out — send them back to shop.
  if (!cart || cart.items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    // Mirrors the backend's own phone check (views.create_order): digits
    // only, at least 10 characters — catch it here before the round trip.
    if (!/^\d{10,}$/.test(form.phone)) {
      setError('Enter a valid phone number (at least 10 digits, numbers only).');
      return;
    }

    setSubmitting(true);
    try {
      await createOrder(form);
      // Navigate first, then refresh the cart in the background. Refreshing
      // before navigating empties the cart while still on /checkout, which
      // triggers this page's own "empty cart -> redirect to /cart" guard
      // and races against this navigation, sometimes winning.
      navigate('/orders');
      refreshCart();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not place your order.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 grid md:grid-cols-[1.3fr_1fr] gap-12">
      <div>
        <h1 className="text-3xl mb-8">Checkout</h1>

        {error && <div className="mb-6"><ErrorBanner message={error} /></div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="field-label">Full name</label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={updateField('name')}
              required
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="address" className="field-label">Shipping address</label>
            <textarea
              id="address"
              value={form.address}
              onChange={updateField('address')}
              required
              rows={3}
              className="input-field resize-none"
            />
          </div>

          <div>
            <label htmlFor="phone" className="field-label">Phone number</label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={updateField('phone')}
              required
              inputMode="numeric"
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="paymentMethod" className="field-label">Payment method</label>
            <select
              id="paymentMethod"
              value={form.paymentMethod}
              onChange={updateField('paymentMethod')}
              className="input-field"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Placing order…' : 'Place order'}
          </button>
        </form>
      </div>

      <div className="border border-line p-6 h-fit">
        <h2 className="font-display text-lg mb-4">Order summary</h2>
        <div className="space-y-3 mb-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-ink/70 truncate pr-4">
                {item.product_name} × {item.quantity}
              </span>
              <span className="shrink-0">{formatMoney(Number(item.product_price) * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-4 border-t border-line font-medium">
          <span>Total</span>
          <span>{formatMoney(cart.total)}</span>
        </div>
      </div>
    </div>
  );
}
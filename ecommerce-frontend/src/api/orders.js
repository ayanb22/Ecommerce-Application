import { api } from './client';

// Matches views.create_order at POST /order/create/.
// Sends `new_address` (not `saved_address`) because the backend has no
// endpoint that exposes a previously-saved address to select from — every
// checkout here is effectively a "new address" checkout. Also matches the
// phone/payment_method fields the view reads directly off request.data.
export async function createOrder({ name, address, phone, paymentMethod }) {
  const { data } = await api.post('/order/create/', {
    name,
    new_address: address,
    phone,
    payment_method: paymentMethod,
  });
  return data;
}

// Matches views.order_list at GET /order/list/. Returns every order for the
// logged-in user, newest first, each with its nested items.
export async function fetchOrders() {
  const { data } = await api.get('/order/list/');
  return data;
}

// Matches views.order_cancel at POST /order/cancel/<pk>/. Restores stock for
// every item in the order and flips its status to 'cancelled' server-side.
export async function cancelOrder(orderId) {
  const { data } = await api.post(`/order/cancel/${orderId}/`);
  return data;
}
import { api } from './client';

// Matches views.get_cart at GET /cart/ (auth required)
export async function fetchCart() {
  const { data } = await api.get('/cart/');
  return data;
}

// Matches views.add_to_cart at POST /cart/add/ — body: { product_id }
export async function addToCart(productId) {
  const { data } = await api.post('/cart/add/', { product_id: productId });
  return data;
}

// Matches views.update_cart at POST /cart/update/ — body: { item_id, quantity }
export async function updateCartItem(itemId, quantity) {
  const { data } = await api.post('/cart/update/', { item_id: itemId, quantity });
  return data;
}

// Matches views.remove_from_cart at POST /cart/remove/ — body: { product_id }
export async function removeFromCart(productId) {
  const { data } = await api.post('/cart/remove/', { product_id: productId });
  return data;
}

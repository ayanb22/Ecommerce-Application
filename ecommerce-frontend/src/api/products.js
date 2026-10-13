import { api } from './client';

// Matches ProductListView at GET /product/
export async function fetchProducts() {
  const { data } = await api.get('/product/');
  return data;
}

// Matches ProductDetailView at GET /product/<pk>/
export async function fetchProduct(pk) {
  const { data } = await api.get(`/product/${pk}/`);
  return data;
}

// Matches views.category_list at GET /category/
export async function fetchCategories() {
  const { data } = await api.get('/category/');
  return data;
}

// Matches ReviewListCreateView at GET /products/<pk>/review/ (note: "products",
// plural, unlike the /product/ routes above). Public and paginated, 5 per page.
// Returns { count, next, previous, results }.
export async function fetchReviews(productId, page = 1) {
  const { data } = await api.get(`/products/${productId}/review/`, { params: { page } });
  return data;
}

// Matches ReviewListCreateView at POST /products/<pk>/review/. Login required.
export async function createReview(productId, { title, review, rating }) {
  const { data } = await api.post(`/products/${productId}/review/`, { title, review, rating });
  return data;
}

// Matches ReviewRetrieveEditDeleteView at PATCH /review/<pk>/. Owner only.
export async function updateReview(reviewId, { title, review, rating }) {
  const { data } = await api.patch(`/review/${reviewId}/`, { title, review, rating });
  return data;
}

// Matches ReviewRetrieveEditDeleteView at DELETE /review/<pk>/. Owner only.
export async function deleteReview(reviewId) {
  const { data } = await api.delete(`/review/${reviewId}/`);
  return data;
}
import { api } from './client';

// Matches views.product_list at GET /product/
export async function fetchProducts() {
  const { data } = await api.get('/product/');
  return data;
}

// Matches views.product_details at GET /product/<pk>/
export async function fetchProduct(pk) {
  const { data } = await api.get(`/product/${pk}/`);
  return data;
}

// Matches views.category_list at GET /category/
export async function fetchCategories() {
  const { data } = await api.get('/category/');
  return data;
}

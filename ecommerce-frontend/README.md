# Common Goods — E-commerce Frontend

React (Vite) frontend built against your Django/DRF backend. Talks to `http://127.0.0.1:8000/api` by default (see `.env`).

## Running it

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Before you run it — Django checklist

Make sure your backend has these fixes in place (from our earlier review) or the frontend will fail against it:

1. `corsheaders` added to `INSTALLED_APPS` in `settings.py`
2. `CORS_ALLOWED_ORIGINS` includes `http://localhost:5173` (this app's dev server)
3. `DB_PORT` env var (not `DB_POST`) set correctly
4. `urls.py`: `product/<int:pk>/` → `views.product_details` (not `product_list`)
5. `urls.py`: `TokenRefreshView` (not `TokenRefreshSlidingView`)
6. `views.py`: `create_order`'s empty-cart check is `if not cart.items.exists()`
7. `views.py`: serializer calls in `get_cart`, `update_cart`, and `add_to_cart` pass `context={'request': request}` (needed for product image URLs)
8. Your Django app is running on `http://127.0.0.1:8000` — if it's on a different host/port, update `VITE_API_BASE_URL` in `.env`

## What's implemented

- **Auth**: register, login, JWT access/refresh with automatic silent refresh on 401 (see `src/api/client.js`), auto-logout if refresh fails
- **Catalog**: product grid with category filtering, product detail page
- **Cart**: add/update quantity/remove, live item count in nav
- **Checkout**: address/phone/payment form → creates order → confirmation page
- **Protected routes**: checkout and order confirmation require login; unauthenticated visitors get sent to `/login` and returned to where they were headed after signing in

## Project structure

```
src/
  api/          — one file per backend resource (auth, products, cart, orders) + shared axios client
  context/      — AuthContext, CartContext (global state)
  components/   — Navbar, ProductCard, ProtectedRoute, shared UI (Spinner/ErrorBanner/EmptyState)
  pages/        — one file per route
  utils/        — money formatting (DRF sends Decimal fields as strings)
```

## Notes

- Your `RegistrationSerializer`/`views.create_order` split address into `saved_address` vs `new_address`; since there's no endpoint to fetch a saved address, this frontend always sends `new_address`.
- Product/cart images fall back to a "No image" placeholder if `product.image` is null (your model allows `blank=True, null=True`).
- Phone validation mirrors the backend's check (digits only, 10+ chars) so bad input is caught before the request is sent.

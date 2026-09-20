import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="border-b border-line bg-paper sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-xl tracking-tight">
          Common Goods
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link to="/" className="hover:text-moss-500 transition-colors">
            Shop
          </Link>

          <Link to="/cart" className="hover:text-moss-500 transition-colors relative">
            Cart
            {itemCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-moss-500 text-paper text-xs font-medium">
                {itemCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link to="/orders" className="hover:text-moss-500 transition-colors">
                Orders
              </Link>
              <span className="text-ink/60">{user?.username}</span>
              <button type="button" onClick={handleLogout} className="hover:text-clay transition-colors">
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="hover:text-moss-500 transition-colors">
                Log in
              </Link>
              <Link to="/register" className="btn-primary text-sm px-4 py-2">
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
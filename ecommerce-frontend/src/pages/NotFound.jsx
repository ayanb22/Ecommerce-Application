import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="max-w-sm mx-auto px-6 py-24 text-center">
      <h1 className="text-3xl mb-3">Page not found</h1>
      <p className="text-ink/60 mb-8">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary">
        Back to shop
      </Link>
    </div>
  );
}

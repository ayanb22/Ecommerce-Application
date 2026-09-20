import { Link } from 'react-router-dom';
import { formatMoney } from '../utils/format';

export default function ProductCard({ product }) {
  return (
    <Link to={`/products/${product.id}`} className="group block">
      <div className="aspect-[4/5] bg-surface border border-line mb-3 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink/30 text-sm">
            No image
          </div>
        )}
      </div>
      <h3 className="font-display text-lg leading-snug">{product.name}</h3>
      <div className="flex items-center justify-between mt-1">
        <span className="text-ink/60 text-sm">{product.category?.name}</span>
        <span className="font-medium">{formatMoney(product.dynamic_price)}</span>
      </div>
      {product.stock_message === 'Out of Stock' && (
        <span className="text-clay text-xs">Out of stock</span>
      )}
    </Link>
  );
}

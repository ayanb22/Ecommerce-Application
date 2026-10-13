// Display-only stars. `value` can be a decimal (like an average); it is rounded
// to the nearest whole star.
export function StarRating({ value = 0, className = '' }) {
  const filled = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span
      className={`inline-flex text-sm leading-none ${className}`}
      role="img"
      aria-label={`${filled} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= filled ? 'text-moss-500' : 'text-ink/20'} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

// Clickable stars for the review form.
export function StarInput({ value, onChange }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
          className={`text-2xl leading-none transition-colors ${
            n <= value ? 'text-moss-500' : 'text-ink/20 hover:text-moss-500/60'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
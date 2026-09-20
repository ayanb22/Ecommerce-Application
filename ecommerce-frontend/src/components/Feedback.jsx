export function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex items-center gap-2.5 text-ink/60 py-8 justify-center" role="status">
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
      </svg>
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="border border-clay/30 bg-clay/5 text-clay px-4 py-3 text-sm flex items-center justify-between gap-4">
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="underline underline-offset-2 shrink-0 hover:no-underline">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="text-center py-20 px-6">
      <h3 className="text-xl mb-2">{title}</h3>
      {description && <p className="text-ink/60 mb-6 max-w-sm mx-auto">{description}</p>}
      {action}
    </div>
  );
}

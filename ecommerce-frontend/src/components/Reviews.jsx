import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchReviews, createReview, updateReview, deleteReview } from '../api/products';
import { extractErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StarRating, StarInput } from './StarRating';
import { Spinner, ErrorBanner } from './Feedback';

const EMPTY_FORM = { title: '', review: '', rating: 0 };

// The backend reports errors in two shapes: {"message": "..."} for its own checks
// (e.g. "Product review already exist") and DRF field errors such as
// {"title": ["This field is required."]}. Handle both, then fall back to the
// shared helper for everything else (network errors, 401s, 500s).
function reviewErrorMessage(err, fallback) {
  const data = err?.response?.data;
  if (data && typeof data === 'object') {
    if (typeof data.message === 'string') return data.message;
    const [firstKey] = Object.keys(data);
    const firstValue = firstKey ? data[firstKey] : null;
    if (Array.isArray(firstValue) && firstValue.length > 0) {
      return `${firstKey}: ${firstValue[0]}`;
    }
  }
  return extractErrorMessage(err, fallback);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function ReviewForm({
  idPrefix,
  initial = EMPTY_FORM,
  submitLabel,
  submittingLabel,
  submitting,
  error,
  onSubmit,
  onCancel,
  resetOnSuccess = false,
}) {
  const [form, setForm] = useState(initial);
  const [localError, setLocalError] = useState(null);

  function updateField(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.rating) {
      setLocalError('Choose a star rating.');
      return;
    }
    setLocalError(null);
    const ok = await onSubmit(form);
    if (ok && resetOnSuccess) setForm(EMPTY_FORM);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(localError || error) && <ErrorBanner message={localError || error} />}

      <div>
        <span className="field-label">Rating</span>
        <StarInput value={form.rating} onChange={(rating) => setForm((f) => ({ ...f, rating }))} />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-title`} className="field-label">Title</label>
        <input
          id={`${idPrefix}-title`}
          type="text"
          value={form.title}
          onChange={updateField('title')}
          required
          maxLength={200}
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-review`} className="field-label">Your review</label>
        <textarea
          id={`${idPrefix}-review`}
          value={form.review}
          onChange={updateField('review')}
          required
          rows={4}
          className="input-field resize-none"
        />
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? submittingLabel : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm text-ink/60 hover:underline">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default function Reviews({ productId, onChanged }) {
  const { isAuthenticated, user } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editError, setEditError] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);

  async function loadFirstPage() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReviews(productId, 1);
      setReviews(data.results);
      setCount(data.count);
      setPage(1);
      setHasMore(Boolean(data.next));
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load reviews.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function loadMore() {
    setLoadingMore(true);
    setError(null);
    try {
      const data = await fetchReviews(productId, page + 1);
      // A review posted in this session shifts later pages by one, so skip
      // anything we already have instead of showing it twice.
      setReviews((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        return [...prev, ...data.results.filter((r) => !seen.has(r.id))];
      });
      setPage(page + 1);
      setHasMore(Boolean(data.next));
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load more reviews.'));
    } finally {
      setLoadingMore(false);
    }
  }

  // Ownership is only used to decide whether to show Edit/Delete. The backend
  // enforces it on PATCH/DELETE regardless (403 for anyone else's review).
  const isMine = (review) =>
    isAuthenticated && Boolean(review.username) && review.username === user?.username;
  const alreadyReviewed = reviews.some(isMine);

  async function handleCreate(values) {
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await createReview(productId, values);
      setReviews((prev) => [created, ...prev]);
      setCount((c) => c + 1);
      onChanged?.();
      return true;
    } catch (err) {
      setFormError(reviewErrorMessage(err, 'Could not post your review.'));
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(reviewId, values) {
    setBusyId(reviewId);
    setEditError(null);
    try {
      const updated = await updateReview(reviewId, values);
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? updated : r)));
      setEditingId(null);
      onChanged?.();
      return true;
    } catch (err) {
      setEditError(reviewErrorMessage(err, 'Could not update your review.'));
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(reviewId) {
    setBusyId(reviewId);
    setActionError(null);
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setCount((c) => Math.max(0, c - 1));
      setConfirmDeleteId(null);
      onChanged?.();
    } catch (err) {
      setActionError(reviewErrorMessage(err, 'Could not delete your review.'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mt-16 pt-10 border-t border-line max-w-2xl">
      <h2 className="text-2xl mb-6">
        Reviews
        {count > 0 && <span className="text-ink/50 text-lg"> ({count})</span>}
      </h2>

      {isAuthenticated ? (
        !alreadyReviewed && (
          <div className="mb-10">
            <h3 className="font-display text-lg mb-4">Write a review</h3>
            <ReviewForm
              idPrefix="new-review"
              submitLabel="Post review"
              submittingLabel="Posting…"
              submitting={submitting}
              error={formError}
              onSubmit={handleCreate}
              resetOnSuccess
            />
          </div>
        )
      ) : (
        <p className="text-ink/60 mb-10">
          <Link
            to="/login"
            state={{ from: { pathname: `/products/${productId}` } }}
            className="text-moss-500 hover:underline"
          >
            Log in
          </Link>{' '}
          to write a review.
        </p>
      )}

      {actionError && <div className="mb-6"><ErrorBanner message={actionError} /></div>}
      {error && <div className="mb-6"><ErrorBanner message={error} onRetry={loadFirstPage} /></div>}

      {loading ? (
        <Spinner label="Loading reviews…" />
      ) : reviews.length === 0 ? (
        !error && <p className="text-ink/60">No reviews yet. Be the first to share what you think.</p>
      ) : (
        <div className="divide-y divide-line border-t border-b border-line">
          {reviews.map((review) => (
            <div key={review.id} className="py-5">
              {editingId === review.id ? (
                <ReviewForm
                  idPrefix={`edit-${review.id}`}
                  initial={{ title: review.title, review: review.review, rating: review.rating }}
                  submitLabel="Save changes"
                  submittingLabel="Saving…"
                  submitting={busyId === review.id}
                  error={editError}
                  onSubmit={(values) => handleUpdate(review.id, values)}
                  onCancel={() => {
                    setEditingId(null);
                    setEditError(null);
                  }}
                />
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating value={review.rating} />
                    <h3 className="font-medium">{review.title}</h3>
                  </div>
                  <p className="text-ink/50 text-sm mb-2">
                    {review.username || 'Customer'} · {formatDate(review.created_at)}
                  </p>
                  <p className="text-ink/80 leading-relaxed whitespace-pre-line">{review.review}</p>

                  {isMine(review) && (
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      {confirmDeleteId === review.id ? (
                        <>
                          <span className="text-ink/60">Delete your review?</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(review.id)}
                            disabled={busyId === review.id}
                            className="text-clay hover:underline"
                          >
                            {busyId === review.id ? 'Deleting…' : 'Yes, delete'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-ink/50 hover:underline"
                          >
                            Never mind
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(review.id);
                              setEditError(null);
                              setActionError(null);
                            }}
                            className="text-ink/60 hover:text-moss-500 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(review.id)}
                            className="text-ink/60 hover:text-clay transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="mt-6 text-sm text-moss-500 hover:underline"
        >
          {loadingMore ? 'Loading…' : 'Show more reviews'}
        </button>
      )}
    </section>
  );
}
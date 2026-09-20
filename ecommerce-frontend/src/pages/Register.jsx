import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../api/client';
import { ErrorBanner } from '../components/Feedback';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', email: '', password: '', password2: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function updateField(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    // Client-side check mirrors RegistrationSerializer.validate(), so the
    // person gets instant feedback instead of a round trip for a mismatch
    // the backend would reject anyway.
    if (form.password !== form.password2) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not create your account.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-sm mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl mb-3">Account created</h1>
        <p className="text-ink/60">Taking you to log in…</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-3xl mb-8">Create an account</h1>

      {error && <div className="mb-6"><ErrorBanner message={error} /></div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="username" className="field-label">Username</label>
          <input
            id="username"
            type="text"
            value={form.username}
            onChange={updateField('username')}
            required
            autoComplete="username"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="email" className="field-label">Email</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={updateField('email')}
            autoComplete="email"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="password" className="field-label">Password</label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={updateField('password')}
            required
            autoComplete="new-password"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="password2" className="field-label">Confirm password</label>
          <input
            id="password2"
            type="password"
            value={form.password2}
            onChange={updateField('password2')}
            required
            autoComplete="new-password"
            className="input-field"
          />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
      </form>

      <p className="text-sm text-ink/60 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-moss-500 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

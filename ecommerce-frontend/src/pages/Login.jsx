import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../api/client';
import { ErrorBanner } from '../components/Feedback';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login({ username, password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      // TokenObtainPairView returns 401 with {"detail": "No active account
      // found with the given credentials"} on a bad username/password.
      setError(extractErrorMessage(err, 'Could not log in with those details.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-3xl mb-8">Log in</h1>

      {error && <div className="mb-6"><ErrorBanner message={error} /></div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="username" className="field-label">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="password" className="field-label">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="input-field"
          />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="text-sm text-ink/60 mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-moss-500 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

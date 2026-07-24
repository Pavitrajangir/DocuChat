import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/documents');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center bg-ink px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <p className="catalog-number mb-2">Reading Room Access</p>
        <h1 className="font-display text-3xl text-text mb-6">Welcome back</h1>

        <div className="bg-surface border border-border rounded-sm p-6 space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Email</label>
            <input
              className="w-full bg-ink border border-border rounded-sm px-3 py-2 text-sm text-text placeholder:text-text-muted/50 focus:border-brass outline-none"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Password</label>
            <input
              className="w-full bg-ink border border-border rounded-sm px-3 py-2 text-sm text-text placeholder:text-text-muted/50 focus:border-brass outline-none"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-brass text-ink font-medium rounded-sm py-2.5 text-sm hover:bg-brass-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Enter the stacks'}
          </button>
        </div>

        <p className="text-sm text-text-muted text-center mt-5">
          No card yet?{' '}
          <Link to="/signup" className="text-brass hover:text-brass-light">
            Request one
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;

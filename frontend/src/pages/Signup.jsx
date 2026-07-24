import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate('/documents');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center bg-ink px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <p className="catalog-number mb-2">New Reading Card</p>
        <h1 className="font-display text-3xl text-text mb-6">Get your card</h1>

        <div className="bg-surface border border-border rounded-sm p-6 space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Name</label>
            <input
              className="w-full bg-ink border border-border rounded-sm px-3 py-2 text-sm text-text placeholder:text-text-muted/50 focus:border-brass outline-none"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
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
            {loading ? 'Issuing card...' : 'Create account'}
          </button>
        </div>

        <p className="text-sm text-text-muted text-center mt-5">
          Already have a card?{' '}
          <Link to="/login" className="text-brass hover:text-brass-light">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;

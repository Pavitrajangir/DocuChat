import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-ink border-b border-border px-6 py-4 flex items-center justify-between">
      <Link to="/" className="font-display text-xl text-text tracking-tight">
        Docu<span className="text-brass">Chat</span>
      </Link>
      {user && (
        <div className="flex items-center gap-6 text-sm font-sans">
          <Link to="/documents" className="text-text-muted hover:text-brass transition-colors">
            The Stacks
          </Link>
          <span className="text-text-muted hidden sm:inline">{user.name}</span>
          <button
            onClick={handleLogout}
            className="text-text-muted hover:text-brass transition-colors"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import '../styles/Auth.css';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, signUp } = useApp();
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = isSignUp ? await signUp(email, password) : await signIn(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Authentication failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Cybo Track</h1>
        <p className="auth-subtitle">Achieve Your Goals</p>

        <form onSubmit={handleAuth}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
          />
          
          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <button
          className="switch-mode"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
          }}
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}


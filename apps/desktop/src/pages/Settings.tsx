import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import '../styles/Settings.css';

export default function Settings() {
  const { user, signOut } = useApp();
  const navigate = useNavigate();

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      signOut();
      navigate('/auth');
    }
  };

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      <div className="settings-section">
        <h2>Account</h2>
        <div className="settings-card">
          <div className="setting-item">
            <label>Email</label>
            <div className="setting-value">{user?.email}</div>
          </div>
          <div className="setting-item">
            <label>User ID</label>
            <div className="setting-value">{user?.id}</div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2>About</h2>
        <div className="settings-card">
          <div className="setting-item">
            <label>Version</label>
            <div className="setting-value">1.0.0</div>
          </div>
          <div className="setting-item">
            <label>App Name</label>
            <div className="setting-value">Cybo Track</div>
          </div>
        </div>
      </div>

      <button className="btn-danger" onClick={handleSignOut}>
        Sign Out
      </button>

      <div className="footer">
        <p>Offline-first goal tracking app</p>
        <p>Data syncs automatically when online</p>
      </div>
    </div>
  );
}


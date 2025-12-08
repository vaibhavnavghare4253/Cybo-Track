import { Outlet, NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import '../styles/Layout.css';

export default function Layout() {
  const { isOnline } = useApp();

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="logo">
          <h1>Cybo Track</h1>
        </div>
        <ul className="nav-menu">
          <li>
            <NavLink to="/" end>
              🏠 Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/goals">
              🎯 Goals
            </NavLink>
          </li>
          <li>
            <NavLink to="/stats">
              📊 Statistics
            </NavLink>
          </li>
          <li>
            <NavLink to="/settings">
              ⚙️ Settings
            </NavLink>
          </li>
        </ul>
        <div className="nav-footer">
          <div className={`status ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </div>
        </div>
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}


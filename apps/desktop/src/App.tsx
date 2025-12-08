import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Goals from './pages/Goals';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import GoalDetail from './pages/GoalDetail';
import NewGoal from './pages/NewGoal';
import Layout from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useApp();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return user ? <>{children}</> : <Navigate to="/auth" />;
}

function AppRoutes() {
  const { user } = useApp();

  return (
    <Routes>
      <Route
        path="/auth"
        element={user ? <Navigate to="/" /> : <Auth />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="goals" element={<Goals />} />
        <Route path="stats" element={<Stats />} />
        <Route path="settings" element={<Settings />} />
        <Route path="goal/:id" element={<GoalDetail />} />
        <Route path="goal/new" element={<NewGoal />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}


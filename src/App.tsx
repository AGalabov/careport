import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { I18nProvider, useTranslation } from './contexts/I18nProvider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CarProvider } from './contexts/CarContext';
import Layout from './components/layout/Layout';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import FuelLogPage from './pages/FuelLogPage';
import RemindersPage from './pages/RemindersPage';
import SettingsPage from './pages/SettingsPage';

function RequireAuth() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 min-h-svh bg-gray-50">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-500">{t('common.loading')}</span>
      </div>
    );
  }
  return user ? <Outlet /> : <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <I18nProvider>
      <Router>
      <AuthProvider>
        <CarProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/fuel" element={<FuelLogPage />} />
                <Route path="/reminders" element={<RemindersPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CarProvider>
      </AuthProvider>
      </Router>
    </I18nProvider>
  );
}

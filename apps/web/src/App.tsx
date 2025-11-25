import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { CalendarPage } from './pages/Calendar';
import { StatsPage } from './pages/Stats';
import { SearchPage } from './pages/Search';
import { SettingsPage } from './pages/Settings';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { useAuthStore } from './stores/auth';
import { useSettingsStore } from './stores/settings';

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { settings, loadSettings } = useSettingsStore();

  useEffect(() => {
    checkAuth();
    loadSettings();
  }, [checkAuth, loadSettings]);

  // 应用主题
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    
    // 设置主题色
    root.style.setProperty('--accent-color', settings.accentColor);
  }, [settings.theme, settings.accentColor]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/*"
        element={
          <Layout>
            <Routes>
              <Route path="/" element={<CalendarPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}

export default App;

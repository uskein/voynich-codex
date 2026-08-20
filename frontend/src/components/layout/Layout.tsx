import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, Globe, FileText, LayoutDashboard,
  LogOut, Menu, X, Bell, Moon, Sun, Sunset,
  Search, Languages
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useI18n } from '../../i18n';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, cycleTheme } = useThemeStore();
  const { language, setLanguage, t } = useI18n();

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Sunset;

  const navigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.myWorlds'), href: '/worlds', icon: Globe },
    { name: t('nav.projects'), href: '/manuscripts', icon: FileText },
    { name: t('nav.library'), href: '/library', icon: BookOpen },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 72 }}
        className="flex flex-col border-r"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <BookOpen className="w-8 h-8 text-burnt-500" />
              <span className="font-serif text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Voynich</span>
            </motion.div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: isActive ? 'rgba(217, 114, 22, 0.2)' : 'transparent',
                  color: isActive ? '#e28a35' : 'var(--text-secondary)'
                }}
              >
                <item.icon className="w-5 h-5" />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User menu */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(217, 114, 22, 0.2)' }}>
              <span className="text-burnt-400 font-medium">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="h-16 flex items-center justify-between px-6 backdrop-blur-sm border-b"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search worlds, manuscripts...' : 'Buscar mundos, manuscritos...'}
                className="pl-10 pr-4 py-2 w-96 border rounded-lg focus:outline-none focus:ring-2 focus:ring-burnt-500"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:opacity-80 text-sm"
              style={{ color: 'var(--text-secondary)' }}
              title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
            >
              <Languages className="w-4 h-4" />
              <span className="font-medium">{language.toUpperCase()}</span>
            </button>

            <button
              onClick={cycleTheme}
              className="p-2 rounded-lg hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
              title={`Theme: ${theme}`}
            >
              <ThemeIcon className="w-5 h-5" />
            </button>

            <button className="relative p-2 rounded-lg hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-burnt-500 rounded-full"></span>
            </button>

            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="p-2 rounded-lg hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/**
 * 主布局组件
 */

import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Calendar, BarChart3, Search, Settings, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', icon: Calendar, label: '日历' },
  { path: '/stats', icon: BarChart3, label: '统计' },
  { path: '/search', icon: Search, label: '搜索' },
  { path: '/settings', icon: Settings, label: '设置' },
];

export function Layout({ children }: LayoutProps) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
            MoodFlow
          </h1>
          
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                  {user?.username || user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="退出登录"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
              >
                <User className="w-4 h-4" />
                登录
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* 底部导航栏 */}
      <nav className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-around">
            {navItems.map(({ path, icon: Icon, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center py-2 px-4 text-xs transition-colors',
                    isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  )
                }
              >
                <Icon className="w-6 h-6 mb-1" />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}

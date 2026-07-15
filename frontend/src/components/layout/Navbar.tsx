import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/tasks': 'All Tasks',
  '/tasks/new': 'Create Task',
  '/tasks/history': 'Task History',
  '/profile': 'Profile',
};

interface NavbarProps {
  onMobileMenuOpen: () => void;
  sidebarCollapsed?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onMobileMenuOpen }) => {
  const { user } = useAuthStore();
  const location = useLocation();

  const getPageTitle = () => {
    if (
      location.pathname.startsWith('/tasks/') &&
      location.pathname !== '/tasks/new' &&
      location.pathname !== '/tasks/history'
    ) {
      return 'Task Details';
    }
    return pageTitles[location.pathname] || 'AI Task Platform';
  };

  return (
    <header className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 bg-surface-800/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-20">
      {/* Left: hamburger (mobile) + page title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMobileMenuOpen}
          aria-label="Open menu"
          className="md:hidden p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-white truncate">{getPageTitle()}</h1>
          <p className="text-xs text-white/40 hidden sm:block">AI Task Processing Platform</p>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Search — desktop only */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-surface-700/50 border border-white/10 rounded-xl">
          <Search className="w-4 h-4 text-white/40" />
          <span className="text-sm text-white/30">Search tasks...</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 sm:p-2.5 bg-surface-700/50 border border-white/10 rounded-xl hover:border-white/20 transition-all">
          <Bell className="w-4 h-4 text-white/60" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
        </button>

        {/* User avatar */}
        {user && (
          <div className="flex items-center gap-2 px-2 sm:px-3 py-2 bg-surface-700/50 border border-white/10 rounded-xl">
            <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-white/80 font-medium hidden lg:block">{user.name}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;

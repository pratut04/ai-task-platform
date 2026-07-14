import React, { Suspense, lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Loader2 } from 'lucide-react';

// Lazy-loaded pages
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const TasksPage = lazy(() => import('@/pages/TasksPage'));
const CreateTaskPage = lazy(() => import('@/pages/CreateTaskPage'));
const TaskDetailPage = lazy(() => import('@/pages/TaskDetailPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Loading fallback
const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-surface-900 flex items-center justify-center">
    <div className="text-center space-y-4">
      <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto" />
      <p className="text-white/40 text-sm">Loading...</p>
    </div>
  </div>
);

// Protected route guard
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Public route guard (redirect if already authenticated)
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

// Wrapped lazy component
export const withSuspense = (Component: React.LazyExoticComponent<React.FC>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export { LoginPage, RegisterPage, DashboardPage, TasksPage, CreateTaskPage, TaskDetailPage, ProfilePage, NotFoundPage };

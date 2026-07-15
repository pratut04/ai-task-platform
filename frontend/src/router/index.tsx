/* eslint-disable react-refresh/only-export-components */
import React, { Suspense, lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Loader2 } from 'lucide-react';

// Lazy-loaded pages — re-exported for use in App.tsx
export const LoginPage = lazy(() => import('@/pages/LoginPage'));
export const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
export const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
export const TasksPage = lazy(() => import('@/pages/TasksPage'));
export const CreateTaskPage = lazy(() => import('@/pages/CreateTaskPage'));
export const TaskDetailPage = lazy(() => import('@/pages/TaskDetailPage'));
export const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
export const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

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

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Cpu } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-white text-xl">AI Task Platform</span>
        </div>

        {/* 404 */}
        <div>
          <h1 className="text-9xl font-extrabold text-gradient leading-none">404</h1>
          <h2 className="text-2xl font-bold text-white mt-4">Page Not Found</h2>
          <p className="text-white/40 mt-2 max-w-sm mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Decorative orbs */}
        <div className="relative">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -z-10" />
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-32 bg-accent-500/10 rounded-full blur-2xl -z-10" />
        </div>

        <Link
          to="/dashboard"
          className="btn-primary inline-flex items-center gap-2 mx-auto"
        >
          <Home className="w-4 h-4" />
          Go to Dashboard
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { User, Mail, Shield, Calendar } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user: storeUser } = useAuthStore();

  const { data: user, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
    initialData: storeUser || undefined,
  });

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      {/* Avatar Card */}
      <Card animate={false} className="p-8 text-center">
        <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
          <span className="text-3xl font-extrabold text-white">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white">{user.name}</h2>
        <p className="text-white/40 mt-1">{user.email}</p>
        <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-primary-500/15 border border-primary-500/30 rounded-full text-xs text-primary-400 font-semibold uppercase tracking-wide">
          <Shield className="w-3 h-3" />
          {user.role}
        </span>
      </Card>

      {/* Details Card */}
      <Card animate={false}>
        <CardHeader>
          <h3 className="font-semibold text-white">Account Information</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <InfoRow icon={<User className="w-4 h-4 text-primary-400" />} label="Full Name" value={user.name} />
          <InfoRow icon={<Mail className="w-4 h-4 text-accent-400" />} label="Email" value={user.email} />
          <InfoRow icon={<Shield className="w-4 h-4 text-emerald-400" />} label="Role" value={user.role} />
          <InfoRow
            icon={<Calendar className="w-4 h-4 text-amber-400" />}
            label="Member Since"
            value={new Date(user.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          />
        </CardBody>
      </Card>
    </div>
  );
};

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon, label, value,
}) => (
  <div className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
    <div className="w-9 h-9 bg-surface-700/50 rounded-xl flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-xs text-white/40">{label}</p>
      <p className="text-sm font-medium text-white capitalize">{value}</p>
    </div>
  </div>
);

export default ProfilePage;

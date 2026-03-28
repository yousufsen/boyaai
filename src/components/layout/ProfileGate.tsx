'use client';

import { useEffect } from 'react';
import { useProfileStore } from '@/store/profileStore';
import { ProfileSelector } from '@/components/ui/ProfileSelector';

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { profile, isLoaded, loadProfile } = useProfileStore();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Show loading while checking profile
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-5xl animate-bounce">🎨</span>
      </div>
    );
  }

  // Show profile selector if no active profile
  if (!profile) {
    return <ProfileSelector />;
  }

  return <>{children}</>;
}

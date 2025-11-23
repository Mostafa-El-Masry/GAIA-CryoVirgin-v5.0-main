'use client';

import type { ReactNode } from 'react';
import PermissionGate from '@/components/permissions/PermissionGate';

export const metadata = {
  title: 'Settings | GAIA',
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  // Only users with "settings" permission can access the Settings pages.
  return <PermissionGate permission="settings">{children}</PermissionGate>;
}

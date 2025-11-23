import type { ReactNode } from 'react';
import PermissionGate from '@/components/permissions/PermissionGate';

export const metadata = {
  title: 'Gallery Awakening | GAIA',
};

export default function GalleryAwakeningLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Gate the full Gallery Awakening section.
  // Inside the section, you can still decide which parts are public/private.
  return <PermissionGate permission="gallery">{children}</PermissionGate>;
}

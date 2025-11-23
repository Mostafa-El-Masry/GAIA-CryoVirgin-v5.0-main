"use client";

import type { ReactNode } from "react";
import PermissionGate from "@/components/permissions/PermissionGate";

export const metadata = {
  title: "Health Awakening | GAIA",
};

export default function HealthAwakeningLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <PermissionGate permission="health">{children}</PermissionGate>;
}

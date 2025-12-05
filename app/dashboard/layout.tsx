"use client";

import type { ReactNode } from "react";
import PermissionGate from "@/components/permissions/PermissionGate";
import LessonGate from "@/components/permissions/LessonGate";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <PermissionGate permission="dashboard">
      <LessonGate featureLabel="Dashboard" minLessons={0}>
        {children}
      </LessonGate>
    </PermissionGate>
  );
}

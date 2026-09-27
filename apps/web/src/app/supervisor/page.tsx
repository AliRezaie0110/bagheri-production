"use client";

import {
  RoleGuard,
} from "@/components/auth/role-guard";
import {
  RoleLanding,
} from "@/components/dashboard/role-landing";

export default function SupervisorPage() {
  return (
    <RoleGuard role="SUPERVISOR">
      {(user) => (
        <RoleLanding
          user={user}
        />
      )}
    </RoleGuard>
  );
}
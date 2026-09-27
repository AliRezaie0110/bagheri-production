"use client";

import {
  RoleGuard,
} from "@/components/auth/role-guard";
import {
  RoleLanding,
} from "@/components/dashboard/role-landing";

export default function AdminPage() {
  return (
    <RoleGuard role="MANAGER">
      {(user) => (
        <RoleLanding
          user={user}
        />
      )}
    </RoleGuard>
  );
}
"use client";

import {
  RoleGuard,
} from "@/components/auth/role-guard";
import {
  RoleLanding,
} from "@/components/dashboard/role-landing";

export default function WorkerPage() {
  return (
    <RoleGuard role="WORKER">
      {(user) => (
        <RoleLanding
          user={user}
        />
      )}
    </RoleGuard>
  );
}
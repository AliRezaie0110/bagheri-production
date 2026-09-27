"use client";

import {
  RoleGuard,
} from "@/components/auth/role-guard";
import {
  RoleLanding,
} from "@/components/dashboard/role-landing";

export default function AssistantPage() {
  return (
    <RoleGuard role="ASSISTANT">
      {(user) => (
        <RoleLanding
          user={user}
        />
      )}
    </RoleGuard>
  );
}
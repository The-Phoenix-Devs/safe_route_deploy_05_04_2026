"use client";

import SessionManagement from "@/components/admin/SessionManagement";
import RequireFullAdmin from "@/components/admin/RequireFullAdmin";

export default function SessionManagementPage() {
  return (
    <RequireFullAdmin>
      <SessionManagement />
    </RequireFullAdmin>
  );
}

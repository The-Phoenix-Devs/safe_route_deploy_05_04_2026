"use client";

import AddAdminForm from "@/components/admin/AddAdminForm";
import RequireFullAdmin from "@/components/admin/RequireFullAdmin";

export default function AddAdminPage() {
  return (
    <RequireFullAdmin>
      <div className="flex justify-center">
        <AddAdminForm />
      </div>
    </RequireFullAdmin>
  );
}

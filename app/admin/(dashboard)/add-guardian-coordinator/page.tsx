"use client";

import RequireFullAdmin from "@/components/admin/RequireFullAdmin";
import AddGuardianCoordinatorForm from "@/components/admin/AddGuardianCoordinatorForm";

export default function AddGuardianCoordinatorPage() {
  return (
    <RequireFullAdmin>
      <div className="flex justify-center">
        <AddGuardianCoordinatorForm />
      </div>
    </RequireFullAdmin>
  );
}

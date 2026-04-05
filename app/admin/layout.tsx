import type { ReactNode } from "react";

/** Server layout so global CSS / RSC ordering stays correct for static export. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}

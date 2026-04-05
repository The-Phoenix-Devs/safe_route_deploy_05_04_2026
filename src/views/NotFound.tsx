import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NotFound = () => {
  const pathname = usePathname();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      pathname,
    );
  }, [pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-muted/50 to-background px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium text-primary">Safe Route</p>
        <h1 className="mt-2 text-5xl font-bold tracking-tight">404</h1>
        <p className="mt-2 text-muted-foreground">
          This page does not exist or was moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

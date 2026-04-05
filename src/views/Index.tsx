import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { isNativeAndroidApp } from "@/lib/nativeAndroidApp";

// Wrap the component to handle router context
const IndexContent = () => {
  const { user, loading, logout } = useSimpleAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (
      user &&
      isNativeAndroidApp() &&
      (user.user_type === "admin" || user.user_type === "guardian_admin")
    ) {
      void (async () => {
        await logout();
        router.replace("/login?reason=native_android");
      })();
      return;
    }

    if (user) {
      if (user.user_type === "admin" || user.user_type === "guardian_admin") {
        router.replace("/admin/dashboard");
      } else if (user.user_type === "driver") {
        router.replace("/driver/dashboard");
      } else if (user.user_type === "guardian") {
        router.replace("/guardian/dashboard");
      }
    } else {
      router.replace("/login");
    }
  }, [user, loading, router, logout]);

  return (
    <>
      <style>{`@keyframes sishu-index-spin{to{transform:rotate(360deg)}}`}</style>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(to bottom, hsl(210 79% 46% / 0.08), hsl(210 20% 98%))",
        }}
      >
        <div
          style={{
            width: "2.5rem",
            height: "2.5rem",
            borderRadius: "9999px",
            border: "2px solid hsl(210 79% 46% / 0.35)",
            borderTopColor: "hsl(210 79% 46%)",
            animation: "sishu-index-spin 0.75s linear infinite",
          }}
          aria-label="Loading"
          role="status"
        />
      </div>
    </>
  );
};

const Index = () => {
  return <IndexContent />;
};

export default Index;

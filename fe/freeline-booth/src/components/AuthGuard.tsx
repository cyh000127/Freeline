"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      if (pathname !== "/login") {
        router.replace("/login");
      }
    } else {
      setIsAuthenticated(true);
    }
  }, [router, pathname]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

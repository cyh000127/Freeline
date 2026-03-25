"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "@/lib/api/auth";
import { getBoothInfo } from "@/lib/api/booth";

interface UserProfile {
  id: string;
  boothId: number;
  boothName: string;
  boothLocation?: string;
  role: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null;
    const boothId = typeof window !== 'undefined' ? localStorage.getItem("boothId") : null;
    const boothName = typeof window !== 'undefined' ? localStorage.getItem("boothName") : null;
    const adminName = typeof window !== 'undefined' ? localStorage.getItem("adminName") : null;

    if (token) {
      if (boothId) {
        const bId = parseInt(boothId);
        setUser({
          id: "", 
          boothId: bId,
          boothName: boothName || "부스",
          role: "BOOTH_ADMIN"
        });

        // Fetch additional booth info (location)
        getBoothInfo(bId).then(res => {
          if (res.success && res.data) {
            setUser(prev => prev ? {
              ...prev,
              boothName: res.data.name,
              boothLocation: res.data.locationCode
            } : null);
          }
        }).catch(err => console.error("Failed to fetch booth info:", err));

        setIsLoading(false);
      } else {
        // Fallback: if boothId is missing but token exists, try to fetch from /v1/auth/me
        try {
          const res = await authApi.getMe();
          if (res.data?.success && res.data?.data) {
            const data = res.data.data;
            setUser({
              id: data.id || "",
              boothId: data.boothId,
              boothName: data.boothName || "부스",
              role: data.role || "BOOTH_ADMIN"
            });
            // Update localStorage for future use
            localStorage.setItem("boothId", data.boothId.toString());
            if (data.boothName) localStorage.setItem("boothName", data.boothName);
            if (data.name) localStorage.setItem("adminName", data.name);
          }
        } catch (error) {
          console.error("Failed to fetch user info from API:", error);
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      setUser(null);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

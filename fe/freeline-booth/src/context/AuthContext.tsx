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
  isPasswordChanged?: boolean;
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
      try {
        const res = await authApi.getMe();
        if (res.data?.success && res.data?.data) {
          const data = res.data.data;
          // Support both snake_case, camelCase and the new isChanged from backend
          const pwdChanged = data.isChanged ?? data.isPasswordChanged ?? data.is_password_changed ?? true;
          
          setUser({
            id: data.id?.toString() || "",
            boothId: data.boothId,
            boothName: data.boothName || data.company || data.name || "부스",
            role: data.role || "BOOTH_ADMIN",
            isPasswordChanged: pwdChanged
          });
          
          // Sync localStorage
          localStorage.setItem("boothId", data.boothId.toString());
          if (data.boothName || data.company || data.name) {
            localStorage.setItem("boothName", data.boothName || data.company || data.name);
          }
          localStorage.setItem("isPasswordChanged", pwdChanged.toString());
          
          // Optionally fetch more detailed booth info if location is missing
          if (data.boothId) {
             getBoothInfo(data.boothId).then(res => {
               if (res.success && res.data) {
                 setUser(prev => prev ? {
                   ...prev,
                   boothLocation: res.data.locationCode
                 } : null);
               }
             }).catch(err => console.error("Failed to fetch booth info:", err));
          }
        } else {
           // If API succeeds but data is weird, fallback to storage
           setFallbackUser();
        }
      } catch (error) {
        console.error("Failed to fetch user info from API:", error);
        // On error, let's try fallback to storage instead of clearing immediately 
        // unless it's a 401/403 which is handled by interceptor
        setFallbackUser();
      } finally {
        setIsLoading(false);
      }
    } else {
      setUser(null);
      setIsLoading(false);
    }
  };

  const setFallbackUser = () => {
    const boothId = localStorage.getItem("boothId");
    const boothName = localStorage.getItem("boothName") || localStorage.getItem("adminName");
    if (boothId) {
      setUser({
        id: "",
        boothId: parseInt(boothId),
        boothName: boothName || "부스",
        role: "BOOTH_ADMIN",
        isPasswordChanged: localStorage.getItem("isPasswordChanged") === "true"
      });
    } else {
      setUser(null);
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

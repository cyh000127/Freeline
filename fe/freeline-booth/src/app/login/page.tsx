"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { KeyRound, Lock } from "lucide-react";
import axios from "axios";
import { authApi } from "@/lib/api/auth";
import { InitFlow } from "@/components/InitFlow";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showInitFlow, setShowInitFlow] = useState(false);
  const [initBoothName, setInitBoothName] = useState("");
  const [initCompany, setInitCompany] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const response = await authApi.login({ id: loginId, password });
      const userData = response.data?.data || response.data;
      
      // 1. 비밀번호 변경 필수 여부 먼저 확인
      if (userData.isPasswordChangeRequired) {
        setInitBoothName(userData.boothName || "");
        setInitCompany(userData.company || "");
        setShowInitFlow(true);
        return; // 대시보드로 이동하지 않고 중단
      }

      const token = userData.accessToken || userData.token;
      
      if (token) {
        localStorage.setItem("accessToken", token);
        
        if (userData.boothId) localStorage.setItem("boothId", userData.boothId.toString());
        
        const bName = userData.boothName || userData.company || userData.name;
        if (bName) localStorage.setItem("boothName", bName);
        
        const pwdChanged = userData.isChanged ?? userData.isPasswordChanged ?? userData.is_password_changed;
        if (pwdChanged !== undefined) {
          localStorage.setItem("isPasswordChanged", pwdChanged.toString());
        }

        // Force refresh AuthContext before redirecting
        await refreshUser();
        router.push("/");
      } else {
        setErrorMsg("로그인에 성공했으나 인증 토큰을 받지 못했습니다.");
      }
    } catch (error: unknown) {
      console.error("Login Error:", error);
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data;
        const errorData = responseData?.error || responseData;
        const msg = errorData?.message || "";
        const status = errorData?.status || "";
        
        // 백엔드 명세 변경으로 403 처리는 기본적으로 발생하지 않으나, 하위 호환성을 위해 유지하거나 정리 가능
        if (status === "PASSWORD_CHANGE_REQUIRED" || (typeof msg === 'string' && msg.includes("비밀번호 변경"))) {
          setShowInitFlow(true);
          return;
        }
        
        setErrorMsg(typeof msg === 'string' ? msg : "로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.");
      } else {
        setErrorMsg("로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showInitFlow && (
        <InitFlow 
          isStandalone={true} 
          initialLoginId={loginId} 
          initialBoothName={initCompany || initBoothName} 
          initialOldPassword={password}
          onFinish={() => setShowInitFlow(false)} 
        />
      )}
      <div className="flex min-h-screen items-center justify-center bg-[#F1F3F5] p-4">
      <Card className="w-full max-w-[480px] p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-xl">
        {/* Header Section */}
        <div className="bg-[#2D2A4A] px-8 py-10 text-center text-white rounded-t-2xl">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold tracking-tight">
            <Image src="/booth/assets/logo.png" alt="줄서잇 매니저 로고" width={100} height={24} priority className="h-6 w-auto object-contain" />
            줄서잇 매니저
          </div>
          <p className="mt-2 text-xs text-gray-300 font-medium">
            부스 운영을 스마트하고 간편하게
          </p>
        </div>

        {/* Form Section */}
        <div className="px-10 py-12 bg-white rounded-b-2xl">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-[22px] font-bold tracking-tight text-[#111111]">
              다시 오신 것을 환영합니다!
            </h2>
            <p className="text-[15px] font-bold text-[#111111]">
              주최측에서 부여받은 아이디, 비밀번호를 입력해주세요.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="text-red-500 text-sm text-center font-medium">
                {errorMsg}
              </div>
            )}
            <div className="relative">
              <KeyRound className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                className="h-12 rounded-xl bg-[#F4F5F7] pl-12 border-0 text-[15px] focus-visible:ring-1 focus-visible:ring-[#2D2A4A]"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl bg-[#F4F5F7] pl-12 border-0 text-[15px] focus-visible:ring-1 focus-visible:ring-[#2D2A4A]"
              />
            </div>
            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="h-[52px] w-full rounded-xl bg-[#2D2A4A] text-[16px] font-bold text-white shadow-md hover:bg-[#3A375C] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
      </div>
    </>
  );
}

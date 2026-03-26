"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, CheckCircle2, Building2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api/auth";
import axios from "axios";

interface InitFlowProps {
  initialLoginId?: string;
  initialBoothName?: string;
  initialOldPassword?: string;
  onFinish?: () => void;
  isStandalone?: boolean;
}

export function InitFlow({ 
  initialLoginId, 
  initialBoothName, 
  initialOldPassword,
  onFinish, 
  isStandalone = false 
}: InitFlowProps) {
  const router = useRouter();
  const auth = useAuth(); // We'll handle the case where focus is null if standalone
  const user = isStandalone ? null : auth?.user;
  const refreshUser = isStandalone ? null : auth?.refreshUser;
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("boothId");
    localStorage.removeItem("isPasswordChanged");
    window.location.href = "/booth/login";
  };

  const handleConfirmCompany = () => {
    setStep(2);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      // Assuming 'user.id' or 'loginId' is needed. 
      // If we don't have loginId in AuthContext, we might need to store it during login or fetch it.
      // For now, let's use administrative name or an empty string if ID is not available, 
      // but usually the loginId is what's used.
      const loginId = initialLoginId || localStorage.getItem("adminName") || ""; 
      
      await authApi.updateInitialPassword({
        loginId,
        oldPassword: initialOldPassword || oldPassword || "",
        newPassword: password
      });
      
      setStep(3);
    } catch (error) {
      console.error("Password change error:", error);
      if (axios.isAxiosError(error)) {
        setErrorMsg(error.response?.data?.message || "비밀번호 변경에 실패했습니다.");
      } else {
        setErrorMsg("비밀번호 변경에 실패했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = async () => {
    if (isStandalone && onFinish) {
      onFinish();
    } else if (refreshUser) {
      localStorage.setItem("isPasswordChanged", "true");
      await refreshUser?.();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-[440px] overflow-hidden rounded-3xl border-0 shadow-2xl animate-in zoom-in-95 duration-300">
        {step === 1 && (
          <div className="p-8 text-center space-y-8">
             <div className="flex justify-center">
                <div className="w-20 h-20 bg-[#2D2A4A]/5 rounded-2xl flex items-center justify-center">
                    <Building2 className="w-10 h-10 text-[#2D2A4A]" />
                </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#2D2A4A]">
                {initialBoothName || user?.boothName || initialLoginId || "환영합니다!"}
              </h2>
              <p className="text-lg font-medium text-gray-600">
                가 맞으십니까?
              </p>
            </div>
            <div className="space-y-3 pt-4">
              <Button 
                onClick={handleConfirmCompany}
                className="w-full h-14 bg-[#2D2A4A] text-lg font-bold text-white rounded-2xl hover:bg-[#3A375C] transition-all"
              >
                네, 맞습니다.
              </Button>
              <button 
                onClick={handleLogout}
                className="text-sm font-medium text-gray-400 hover:text-gray-600 underline underline-offset-4"
              >
                아닙니다. (다시 로그인)
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-8">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-50 rounded-full mb-4">
                <Lock className="w-6 h-6 text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold text-[#2D2A4A]">비밀번호 변경</h2>
              <p className="mt-2 text-sm text-gray-500">
                최초 로그인 시 보안을 위해<br />비밀번호 변경이 필요합니다.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5">
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 text-sm font-medium text-red-500 bg-red-50 rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                  {errorMsg}
                </div>
              )}
              
              {!initialOldPassword && (
                <div className="space-y-2">
                  <Label htmlFor="old-password">현재 비밀번호 (초기 비밀번호)</Label>
                  <Input 
                    id="old-password"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="현재 비밀번호를 입력해주세요"
                    className="h-12 bg-[#F8F9FA] border-0 rounded-xl"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="new-password">새 비밀번호</Label>
                <Input 
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="새 비밀번호를 입력해주세요"
                  className="h-12 bg-[#F8F9FA] border-0 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">비밀번호 확인</Label>
                <Input 
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호를 다시 한번 입력해주세요"
                  className="h-12 bg-[#F8F9FA] border-0 rounded-xl"
                  required
                />
              </div>

              <Button 
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-[#2D2A4A] text-lg font-bold text-white rounded-2xl mt-4 hover:bg-[#3A375C] transition-all"
              >
                {isLoading ? "변경 중..." : "비밀번호 변경 완료"}
              </Button>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="p-10 text-center space-y-8">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#2D2A4A]">초기 설정 완료!</h2>
              <p className="text-gray-500">
                모든 준비가 끝났습니다.<br />이제 부스 관리를 시작해보세요.
              </p>
            </div>
            <Button 
              onClick={handleFinish}
              className="w-full h-14 bg-[#2D2A4A] text-lg font-bold text-white rounded-2xl hover:bg-[#3A375C] transition-all"
            >
              {isStandalone ? "로그인하러 가기" : "시작하기"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

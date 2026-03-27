"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { authApi } from "@/lib/api/auth";
import { LogOut } from "lucide-react";
import { useModal } from "@/context/ModalContext";

export default function SettingsPage() {
  const router = useRouter();
  const { showAlert, showConfirm } = useModal();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check for auth token, redirect to login if missing
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    // Fetch user info
    const fetchUser = async () => {
      try {
        const res = await authApi.getMe();
        if (res.data?.success && res.data?.data) {
          setName(res.data.data.name || "");
          setOrganization(res.data.data.organization || "");
        }
      } catch (err) {
        console.error("Failed to fetch user info", err);
      } finally {
        setIsChecking(false);
      }
    };

    fetchUser();
  }, [router]);

  // Profile Form
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");

  // Password Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      const payload: { name?: string; company?: string } = {};
      if (name.trim()) payload.name = name;
      if (organization.trim()) payload.company = organization;

      if (Object.keys(payload).length === 0) {
        showAlert("수정할 항목을 하나 이상 입력해주세요.");
        setIsLoading(false);
        return;
      }

      await authApi.updateMe(payload);
      showAlert("입력하신 정보가 수정되었습니다.");
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || "수정 실패. 네트워크 로그를 확인하세요.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== newPasswordConfirm) {
      showAlert("새 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    try {
      setIsLoading(true);
      // NOTE: 백엔드의 실제 DTO 스펙에 맞게 currentPassword 필드 매핑이 다를 수 있음.
      await authApi.changePassword({ currentPassword, newPassword });
      showAlert("비밀번호가 변경되었습니다.");
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || "비밀번호 변경 실패.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    showConfirm("정말로 탈퇴하시겠습니까?", async () => {
      try {
        setIsLoading(true);
        await authApi.deleteAccount();
        showAlert("탈퇴가 완료되었습니다.");
        localStorage.removeItem("accessToken");
        router.push("/login");
      } catch (err: any) {
        showAlert(err.response?.data?.message || err.message || "탈퇴 실패.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleLogout = () => {
    showConfirm("로그아웃 하시겠습니까?", () => {
      localStorage.removeItem("accessToken");
      router.replace("/login");
    });
  };

  if (isChecking) {
    return <div className="min-h-screen bg-[#F1F3F5]" />;
  }

  return (
    <div className="min-h-screen bg-[#F1F3F5] flex flex-col">
      {/* Top Navbar */}
      <header className="h-24 bg-[#2D2A4A] flex items-center justify-between px-8 text-white shrink-0">
        <div className="w-[100px]">
          <Link href="/" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">
            ← 뒤로가기
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center mt-2">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Image src="/super/assets/logo.png" alt="줄서잇 매니저 로고" width={100} height={24} className="h-6 w-auto object-contain" priority />
            줄서잇 매니저
          </div>
          <p className="mt-2 text-sm text-gray-300 font-medium">
            설정 및 내 정보
          </p>
        </div>

        <div className="w-[100px] flex justify-end text-gray-300 gap-2">
          <button
            title="로그아웃"
            onClick={handleLogout}
            className="hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8">

        <h1 className="text-3xl font-bold text-[#111111] tracking-tight">계정 설정</h1>

        {/* Profile Info Edit Section */}
        <Card className="p-8 rounded-2xl border-0 shadow-sm bg-white">
          <h2 className="text-xl font-bold text-gray-900 mb-6">회원정보 수정</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">이름</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="변경할 이름만 입력 (미변경시 비워둠)"
                className="h-12 bg-[#F4F5F7] border-0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">소속 (단체/기관명)</label>
              <Input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="변경할 소속만 입력 (미변경시 비워둠)"
                className="h-12 bg-[#F4F5F7] border-0"
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isLoading} className="bg-[#2D2A4A] text-white hover:bg-[#3A375C] h-10 px-6 font-bold rounded-xl">
                정보 저장
              </Button>
            </div>
          </form>
        </Card>

        {/* Password Change Section */}
        <Card className="p-8 rounded-2xl border-0 shadow-sm bg-white">
          <h2 className="text-xl font-bold text-gray-900 mb-6">비밀번호 변경</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">현재 비밀번호</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-12 bg-[#F4F5F7] border-0"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">새 비밀번호</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-12 bg-[#F4F5F7] border-0"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">새 비밀번호 확인</label>
              <Input
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                className="h-12 bg-[#F4F5F7] border-0"
                required
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isLoading} className="bg-[#2D2A4A] text-white hover:bg-[#3A375C] h-10 px-6 font-bold rounded-xl">
                비밀번호 변경
              </Button>
            </div>
          </form>
        </Card>

        {/* Delete Account Section */}
        <Card className="p-8 rounded-2xl border-0 shadow-sm bg-red-50/30 border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-red-600 mb-2">회원 탈퇴</h2>
              <p className="text-sm text-gray-500">계정을 삭제하면 관련된 모든 권한과 행사 정보가 영구적으로 사라집니다.</p>
            </div>
            <Button
              type="button"
              onClick={handleDeleteAccount}
              disabled={isLoading}
              variant="destructive"
              className="bg-red-500 hover:bg-red-600 text-white font-bold h-10 px-6 rounded-xl shrink-0"
            >
              회원 탈퇴하기
            </Button>
          </div>
        </Card>

      </main>
    </div>
  );
}

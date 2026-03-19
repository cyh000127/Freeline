import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { KeyRound, Lock } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F1F3F5] p-4">
      <Card className="w-full max-w-[480px] p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-xl">
        {/* Header Section */}
        <div className="bg-[#2D2A4A] px-8 py-10 text-center text-white rounded-t-2xl">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold tracking-tight">
            <img src="/assets/logo.png" alt="줄서잇 매니저 로고" className="h-6 w-auto object-contain" />
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
          </div>

          <form className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="아이디"
                className="h-12 rounded-xl bg-[#F4F5F7] pl-12 border-0 text-[15px] focus-visible:ring-1 focus-visible:ring-[#2D2A4A]"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <Input
                type="password"
                placeholder="비밀번호"
                className="h-12 rounded-xl bg-[#F4F5F7] pl-12 border-0 text-[15px] focus-visible:ring-1 focus-visible:ring-[#2D2A4A]"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" className="rounded-[4px] border-gray-300 data-[state=checked]:bg-[#2D2A4A] data-[state=checked]:border-[#2D2A4A]" />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none text-gray-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  아이디 정보 기억하기
                </label>
              </div>
              <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                아이디/비밀번호 찾기
              </a>
            </div>

            <div className="pt-4">
              <Button className="h-[52px] w-full rounded-xl bg-[#2D2A4A] text-[16px] font-bold text-white shadow-md hover:bg-[#3A375C] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                로그인
              </Button>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-6">
              <span className="text-sm text-gray-400">아직 줄서잇 매니저에 합류하지 않았습니까?</span>
              <Link href="/register" className="text-sm font-bold text-gray-700 hover:text-gray-900">
                회원가입
              </Link>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { KeyRound, Lock, ChevronLeft, CheckCircle2, User, Building2 } from "lucide-react";
import Link from "next/link";
import { authApi } from "@/lib/api/auth";
import { useModal } from "@/context/ModalContext";

export default function RegisterPage() {
  const router = useRouter();
  const { showAlert } = useModal();

  const [email, setEmail] = useState("");
  const [isEmailAvailable, setIsEmailAvailable] = useState<boolean | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [isTermsAgreed, setIsTermsAgreed] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // 이메일 유효성 검사 함수
  const validateEmail = (email: string) => {
    // TLD length limited to 2-10 for realistic validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/;
    return emailRegex.test(email);
  };

  // 이메일 중복 확인 (직접 호출용)
  const handleCheckEmailDuplicate = async (emailToCheck: string = email) => {
    if (!validateEmail(emailToCheck)) return;
    if (isVerified) return;

    try {
      setIsCheckingEmail(true);
      const response = await authApi.checkEmail(emailToCheck);
      const isAvailable = response.data?.data?.isAvailable;
      setIsEmailAvailable(isAvailable === true);
    } catch (error: any) {
      console.error(error);
      setIsEmailAvailable(false);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // 이메일 입력 시 debounce 자동 중복 확인
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isVerified) return;
    if (!validateEmail(email)) {
      setIsEmailAvailable(null);
      return;
    }
    setIsEmailAvailable(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handleCheckEmailDuplicate(email);
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [email, isVerified]);

  // 이메일 인증 보내기
  const handleSendVerification = async () => {
    if (!email.includes("@")) {
      showAlert("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    try {
      setIsLoading(true);
      await authApi.sendEmailCode(email);
      setIsVerificationSent(true);
      showAlert("인증번호가 전송되었습니다.");
    } catch (error: any) {
      console.error(error);
      showAlert(error.response?.data?.message || "인증번호 전송에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 인증번호 검증
  const handleVerifyCodeSubmit = async () => {
    if (!verificationCode) return;

    try {
      setIsLoading(true);
      await authApi.verifyEmailCode({ email, code: verificationCode });
      setIsVerified(true);
      showAlert("인증이 완료되었습니다.");
    } catch (error: any) {
      console.error(error);
      showAlert(error.response?.data?.message || "인증번호가 올바르지 않습니다.");
      setIsVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 회원가입
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setIsLoading(true);
      // Backend might require a name. If not, we just send email & password
      await authApi.signup({ email, password, name, company });
      showAlert("회원가입이 완료되었습니다. 로그인해주세요.");
      router.push("/login");
    } catch (error: any) {
      console.error(error);
      showAlert(error.response?.data?.message || "회원가입에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 비밀번호 조건 확인
  const hasMinLength = password.length >= 8;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/g.test(password);
  const passwordsMatch = password.length > 0 && password === passwordConfirm;

  // 모든 조건이 충족되었는지 확인
  const isFormValid =
    email.length > 0 &&
    isVerified &&
    hasMinLength &&
    hasSpecialChar &&
    password === passwordConfirm &&
    name.trim().length > 0 &&
    company.trim().length > 0 &&
    isTermsAgreed;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F1F3F5] p-4 py-12">
      <Card className="w-full max-w-[560px] p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-xl">
        {/* Header Section */}
        <div className="relative bg-[#2D2A4A] py-8 text-center text-white rounded-t-2xl">
          <Link href="/login" className="absolute left-6 top-8 flex items-center text-sm font-medium text-gray-300 hover:text-white transition-colors">
            <ChevronLeft className="mr-1 h-4 w-4" />
            뒤로 가기
          </Link>
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <Image src="/super/assets/logo.png" alt="줄서잇 매니저 로고" width={100} height={24} className="h-6 w-auto object-contain" priority />
              줄서잇 매니저
            </div>
            <p className="mt-2 text-sm text-gray-300 font-medium">
              부스 운영을 스마트하고 간편하게
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="px-12 py-10 bg-white rounded-b-2xl">
          <form className="space-y-6" onSubmit={handleSignup}>

            {/* Name Field */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#111111]">이름</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const value = e.target.value;
                    // 한글 자음/모음(ㄱ-ㅎ, ㅏ-ㅣ) 포함하여 IME 입력 시 끊김 현상 방지
                    if (/^[a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣\s]*$/.test(value)) {
                      setName(value);
                    }
                  }}
                  maxLength={20}
                  placeholder="실명 입력 (최대 20자)"
                  className={`h-12 rounded-xl pl-12 border-0 text-[15px] focus-visible:ring-2 transition-all ${name.length >= 20
                    ? "bg-red-50 ring-2 ring-red-500"
                    : "bg-[#F4F5F7] focus-visible:ring-[#2D2A4A]"
                    }`}
                />
                {name.length >= 20 && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    최대 20자까지 입력 가능합니다.
                  </p>
                )}
              </div>
            </div>

            {/* Organization Field */}
            <div className="space-y-2 mt-2">
              <label className="text-sm font-bold text-[#111111]">소속 (단체/기관명)</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  value={company}
                  onChange={(e) => {
                    const value = e.target.value;
                    // 한글 자음/모음(ㄱ-ㅎ, ㅏ-ㅣ) 포함하여 IME 입력 시 끊김 현상 방지
                    if (/^[a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣\s]*$/.test(value)) {
                      setCompany(value);
                    }
                  }}
                  maxLength={50}
                  placeholder="소속 단체명 입력 (최대 50자)"
                  className={`h-12 rounded-xl pl-12 border-0 text-[15px] focus-visible:ring-2 transition-all ${company.length >= 50
                    ? "bg-red-50 ring-2 ring-red-500"
                    : "bg-[#F4F5F7] focus-visible:ring-[#2D2A4A]"
                    }`}
                />
                {company.length >= 50 && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    최대 50자까지 입력 가능합니다.
                  </p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2 mt-2">
              <label className="text-sm font-bold text-[#111111]">이메일</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <KeyRound className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }}
                    onBlur={() => handleCheckEmailDuplicate()}
                    disabled={isVerified}
                    maxLength={100}
                    placeholder="이메일 주소 입력"
                    className={`h-12 rounded-xl pl-12 pr-32 border-0 text-[15px] focus-visible:ring-2 transition-all focus-visible:ring-[#2D2A4A] disabled:opacity-50 ${isEmailAvailable === false || (email.length > 0 && !validateEmail(email))
                      ? "bg-red-50 ring-2 ring-red-500"
                      : "bg-[#F4F5F7]"
                      }`}
                  />
                  {/* 오른쪽 상태 메시지 */}
                  <div className="absolute right-4 top-0 h-full flex items-center pointer-events-none">
                    {email.length > 0 && !validateEmail(email) && (
                      <span className="text-xs font-bold text-red-500 whitespace-nowrap">올바르지 않은 형식</span>
                    )}
                    {isCheckingEmail && (
                      <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">확인 중...</span>
                    )}
                    {!isCheckingEmail && validateEmail(email) && isEmailAvailable === true && (
                      <span className="text-xs font-bold text-green-600 whitespace-nowrap">사용 가능</span>
                    )}
                    {!isCheckingEmail && validateEmail(email) && isEmailAvailable === false && (
                      <span className="text-xs font-bold text-red-500 whitespace-nowrap">이미 가입된 이메일</span>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleSendVerification}
                  disabled={!validateEmail(email) || isEmailAvailable === false || isLoading || isVerified}
                  className="h-12 px-6 rounded-xl bg-[#2D2A4A] font-bold text-white hover:bg-[#3A375C] whitespace-nowrap disabled:bg-gray-400"
                >
                  {isVerified ? "인증완료" : isVerificationSent ? "재전송" : "인증하기"}
                </Button>
              </div>
            </div>


            {/* Verification Code Field */}
            {isVerificationSent && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-bold text-[#111111]">인증번호 입력</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      disabled={isVerified}
                      placeholder="인증번호 6자리"
                      className="h-12 rounded-xl bg-[#F4F5F7] px-4 border-0 text-[15px] focus-visible:ring-1 focus-visible:ring-[#2D2A4A] disabled:opacity-50"
                    />
                    {isVerified && (
                      <div className="absolute right-4 top-3.5 flex items-center text-[#10B981] text-sm font-bold">
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        인증되었습니다.
                      </div>
                    )}
                  </div>
                  {!isVerified && (
                    <Button
                      type="button"
                      onClick={handleVerifyCodeSubmit}
                      disabled={isLoading || !verificationCode}
                      variant="outline"
                      className="h-12 px-6 rounded-xl font-bold border-gray-200 text-gray-700 disabled:opacity-50 min-w-[100px]"
                    >
                      확인
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Password Field */}
            <div className="space-y-2 mt-2">
              <label className="text-sm font-bold text-[#111111]">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={20}
                  className={`h-12 rounded-xl pl-12 border-0 text-[15px] focus-visible:ring-2 transition-all ${password.length >= 20
                    ? "bg-red-50 ring-2 ring-red-500"
                    : "bg-[#F4F5F7] focus-visible:ring-[#2D2A4A]"
                    }`}
                />
              </div>
              {password.length >= 20 && (
                <p className="text-[11px] text-red-500 mt-1 font-medium pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  최대 20자까지 입력 가능합니다.
                </p>
              )}
              {/* 비밀번호 조건 상태 표시 */}
              <div className="flex gap-4 mt-2 pl-1">
                <div className={`flex items-center text-xs font-medium transition-colors ${hasMinLength ? "text-green-600" : "text-gray-400"}`}>
                  <CheckCircle2 className={`mr-1 h-3.5 w-3.5 ${hasMinLength ? "opacity-100" : "opacity-30"}`} />
                  8자 이상
                </div>
                <div className={`flex items-center text-xs font-medium transition-colors ${hasSpecialChar ? "text-green-600" : "text-gray-400"}`}>
                  <CheckCircle2 className={`mr-1 h-3.5 w-3.5 ${hasSpecialChar ? "opacity-100" : "opacity-30"}`} />
                  특수문자 포함
                </div>
              </div>
            </div>

            {/* Password Confirm Field */}
            <div className="space-y-2 mt-2">
              <label className="text-sm font-bold text-[#111111]">비밀번호 확인</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                <Input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  maxLength={20}
                  className={`h-12 rounded-xl pl-12 border-0 text-[15px] focus-visible:ring-2 transition-all ${passwordConfirm.length >= 20
                    ? "bg-red-50 ring-2 ring-red-500"
                    : "bg-[#F4F5F7] focus-visible:ring-[#2D2A4A]"
                    }`}
                />
              </div>
              {passwordConfirm.length >= 20 && (
                <p className="text-[11px] text-red-500 mt-1 font-medium pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  최대 20자까지 입력 가능합니다.
                </p>
              )}
              {passwordConfirm.length > 0 && (
                <div className={`flex items-center mt-2 pl-1 text-xs font-medium transition-colors ${passwordsMatch ? "text-green-600" : "text-red-500"}`}>
                  <CheckCircle2 className={`mr-1 h-3.5 w-3.5 ${passwordsMatch ? "opacity-100" : "opacity-30"}`} />
                  {passwordsMatch ? "비밀번호가 일치합니다" : "비밀번호가 일치하지 않습니다"}
                </div>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center justify-center pt-4 pb-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={isTermsAgreed}
                  onCheckedChange={(checked) => setIsTermsAgreed(checked as boolean)}
                  className="h-5 w-5 rounded-[4px] border-gray-300 data-[state=checked]:bg-[#2D2A4A] data-[state=checked]:border-[#2D2A4A]"
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-bold text-gray-800 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  [필수] 개인정보 수집 동의
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="h-[56px] w-full rounded-xl bg-[#2D2A4A] text-[16px] font-bold text-white shadow-md hover:bg-[#3A375C] hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? "처리 중..." : "회원가입"}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

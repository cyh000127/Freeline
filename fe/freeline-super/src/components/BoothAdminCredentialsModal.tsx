"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Download, KeyRound, X } from "lucide-react";

import type { CreatedBoothAdminCredential } from "@/lib/api/event";

interface BoothAdminCredentialsModalProps {
  open: boolean;
  eventName?: string;
  credentials: CreatedBoothAdminCredential[];
  onClose: () => void;
}

function escapeCsvValue(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function fallbackCopy(text: string) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

export function BoothAdminCredentialsModal({
  open,
  eventName,
  credentials,
  onClose,
}: BoothAdminCredentialsModalProps) {
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (open) {
      setFeedback("");
    }
  }, [open, credentials]);

  const copyText = useMemo(() => {
    const header = ["부스명", "로그인 ID", "임시 비밀번호", "이메일"];
    const rows = credentials.map((credential) => [
      credential.boothName,
      credential.loginId,
      credential.rawPassword,
      credential.email,
    ]);
    return [header, ...rows].map((row) => row.join("\t")).join("\n");
  }, [credentials]);

  const csvText = useMemo(() => {
    const header = ["boothName", "loginId", "rawPassword", "email", "name", "company"];
    const rows = credentials.map((credential) => [
      credential.boothName,
      credential.loginId,
      credential.rawPassword,
      credential.email,
      credential.name ?? "",
      credential.company ?? "",
    ]);
    return [header, ...rows]
      .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
      .join("\n");
  }, [credentials]);

  if (!open || credentials.length === 0) {
    return null;
  }

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copyText);
      } else {
        fallbackCopy(copyText);
      }
      setFeedback("계정 정보를 클립보드에 복사했습니다.");
    } catch {
      setFeedback("복사에 실패했습니다. CSV 다운로드를 이용해 주세요.");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([`\uFEFF${csvText}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(eventName || "booth-admin-credentials").replace(/\s+/g, "-")}-credentials.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setFeedback("CSV 파일을 다운로드했습니다.");
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]">
      <div className="relative flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-gray-100 bg-[#2D2A4A] px-8 py-7 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <KeyRound className="h-6 w-6 text-[#C4FF00]" />
            </div>
            <div>
              <h2 className="text-xl font-black">생성된 부스 관리자 계정 정보</h2>
              <p className="mt-1 text-sm text-gray-200">
                비밀번호는 지금 한 번만 확인 가능, 이후 분실 시 이메일 재발송으로 재설정
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-8 py-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong className="font-bold">운영 안내:</strong> 테스트와 QA는 이 화면에서 바로 복사해 로그인하고,
            실제 운영 전달은 기존 이메일 일괄 전송을 사용해 주세요.
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-500">
              총 <span className="font-black text-[#2D2A4A]">{credentials.length}개</span> 계정이 생성되었습니다.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-xl bg-[#2D2A4A] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#3A375C]"
              >
                <Copy className="h-4 w-4" />
                전체 복사
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 rounded-xl bg-[#C4FF00] px-4 py-2.5 text-sm font-bold text-[#2D2A4A] transition-colors hover:bg-[#bcfd00]"
              >
                <Download className="h-4 w-4" />
                CSV 다운로드
              </button>
            </div>
          </div>

          {feedback ? <p className="text-sm font-medium text-[#2D2A4A]">{feedback}</p> : null}

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[#F8F9FA] text-left text-xs font-black uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">부스명</th>
                  <th className="px-4 py-3">로그인 ID</th>
                  <th className="px-4 py-3">임시 비밀번호</th>
                  <th className="px-4 py-3">이메일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {credentials.map((credential) => (
                  <tr key={`${credential.adminId}-${credential.loginId}`} className="text-gray-700">
                    <td className="px-4 py-3 font-semibold text-gray-900">{credential.boothName}</td>
                    <td className="px-4 py-3 font-mono text-xs">{credential.loginId}</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-[#2D2A4A]">{credential.rawPassword}</td>
                    <td className="px-4 py-3 text-xs">{credential.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-100 bg-[#F8F9FA] px-8 py-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-gray-700 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-gray-50"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

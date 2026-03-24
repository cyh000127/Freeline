"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import * as XLSX from "xlsx";
import {
  Settings,
  LogOut,
  Upload,
  CheckSquare,
  Square,
  Mail,
  MailCheck,
  Loader2,
  FileSpreadsheet,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  ChevronDown,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { authApi } from "@/lib/api/auth";
import { eventApi, Event } from "@/lib/api/event";

// ─── Types ───────────────────────────────────────────────────────────────────
interface BoothRow {
  id: string; // internal row id
  boothName: string;
  email: string;
  loginId: string;
  password: string;
  selected: boolean;
  status: "pending" | "created" | "sent" | "error";
  boothAdminId?: number;
}

// ─── Helper: generate random credentials ─────────────────────────────────────
const CHARS_ALPHA_NUM = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CHARS_SPECIAL = "!@#$%^&*";

function genLoginId(): string {
  const suffix = Array.from({ length: 6 }, () =>
    CHARS_ALPHA_NUM[Math.floor(Math.random() * CHARS_ALPHA_NUM.length)]
  ).join("");
  return `booth_${suffix}`;
}

function genPassword(): string {
  const pool = CHARS_ALPHA_NUM + CHARS_SPECIAL;
  const base = Array.from({ length: 10 }, () =>
    pool[Math.floor(Math.random() * pool.length)]
  );
  // ensure at least one special character
  base[Math.floor(Math.random() * 10)] =
    CHARS_SPECIAL[Math.floor(Math.random() * CHARS_SPECIAL.length)];
  return base.join("");
}

// ─── Helper: parse CSV/XLSX buffer → BoothRow[] ──────────────────────────────
function parseFile(file: File): Promise<BoothRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, {
          defval: "",
        });

        const rows: BoothRow[] = json
          .filter((r) => {
            const name = r["부스명"] || r["name"] || r["booth_name"] || r["부스 명"] || "";
            const email = r["이메일"] || r["email"] || r["Email"] || "";
            return name.trim() && email.trim();
          })
          .map((r) => ({
            id: crypto.randomUUID(),
            boothName:
              (r["부스명"] || r["name"] || r["booth_name"] || r["부스 명"] || "").trim(),
            email: (r["이메일"] || r["email"] || r["Email"] || "").trim(),
            loginId: genLoginId(),
            password: genPassword(),
            selected: true,
            status: "pending" as const,
          }));

        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BoothManagementPage() {
  const router = useRouter();

  // Auth / header state
  const [isChecking, setIsChecking] = useState(true);
  const [userName, setUserName] = useState("익명");
  const [timeLeft, setTimeLeft] = useState(3600);

  // Event dropdown
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);

  // File + rows
  const [rows, setRows] = useState<BoothRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Visibility
  const [showPasswords, setShowPasswords] = useState(false);

  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // ── Auth check ───────────────────────────────────────────────────────────
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    const fetchUser = async () => {
      try {
        const res = await authApi.getMe();
        if (res.data?.success && res.data?.data?.name) {
          setUserName(res.data.data.name);
        }
      } catch {
        /* ignore */
      } finally {
        setIsChecking(false);
      }
    };
    fetchUser();
  }, [router]);

  // ── Fetch events ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await eventApi.getEvents(0, 100);
        if (res.data?.success && Array.isArray(res.data?.data?.content)) {
          setEvents(res.data.data.content);
        } else if (res.data && Array.isArray((res.data as any).content)) {
          setEvents((res.data as any).content);
        }
      } catch {
        /* ignore */
      }
    };
    fetchEvents();
  }, []);

  // ── Session timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const handleRefresh = async () => {
    try {
      const rToken = localStorage.getItem("refreshToken");
      if (!rToken) { alert("다시 로그인해주세요."); router.replace("/login"); return; }
      const res = await authApi.refresh({ refreshToken: rToken });
      const d = res.data?.data;
      if (d?.accessToken) {
        localStorage.setItem("accessToken", d.accessToken);
        if (d.refreshToken) localStorage.setItem("refreshToken", d.refreshToken);
        setTimeLeft(3600);
        alert("로그인 시간이 연장되었습니다.");
      } else throw new Error();
    } catch {
      alert("연장 실패. 다시 로그인해주세요.");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      router.replace("/login");
    }
  };

  const handleLogout = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      localStorage.removeItem("accessToken");
      router.replace("/login");
    }
  };

  // ── File handling ─────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext || "")) {
      alert("CSV 또는 XLSX 파일만 업로드 가능합니다.");
      return;
    }
    setFileName(file.name);
    setIsParsing(true);
    try {
      const parsed = await parseFile(file);
      if (parsed.length === 0) {
        alert("파일에서 데이터를 찾을 수 없습니다.\n컬럼명: 부스명(name), 이메일(email)을 확인해주세요.");
      }
      setRows(parsed);
    } catch {
      alert("파일 파싱에 실패했습니다. 파일 형식을 확인해주세요.");
    } finally {
      setIsParsing(false);
    }
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  // ── Row actions ───────────────────────────────────────────────────────────
  const toggleAll = () => {
    const allSelected = rows.every((r) => r.selected);
    setRows((prev) => prev.map((r) => ({ ...r, selected: !allSelected })));
  };

  const toggleRow = (id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)));
  };

  const deleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const regenCredentials = (id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, loginId: genLoginId(), password: genPassword() } : r))
    );
  };

  const regenAll = () => {
    setRows((prev) => prev.map((r) => ({ ...r, loginId: genLoginId(), password: genPassword() })));
  };

  // ── API actions ───────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!selectedEventId) { alert("행사를 먼저 선택해주세요."); return; }
    if (rows.length === 0) { alert("업로드된 데이터가 없습니다."); return; }

    setIsCreating(true);
    try {
      const payload = {
        eventId: selectedEventId,
        booths: rows.map((r) => ({
          boothName: r.boothName,
          loginId: r.loginId,
          password: r.password,
          email: r.email,
        })),
      };
      const res = await authApi.bulkCreateBoothAdmins(payload);
      const created = res.data?.data;

      // Map back boothAdminIds if returned
      if (Array.isArray(created)) {
        setRows((prev) =>
          prev.map((r, i) => ({
            ...r,
            status: "created" as const,
            boothAdminId: created[i]?.boothAdminId ?? created[i]?.id,
          }))
        );
      } else {
        setRows((prev) => prev.map((r) => ({ ...r, status: "created" as const })));
      }
      alert(`${rows.length}개 부스 관리자 계정이 성공적으로 생성되었습니다.`);
    } catch (err: any) {
      alert(err.response?.data?.message || "계정 생성에 실패했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSend = async (targetRows: BoothRow[]) => {
    if (!selectedEventId) { alert("행사를 먼저 선택해주세요."); return; }
    if (targetRows.length === 0) { alert("선택된 부스가 없습니다."); return; }

    setIsSending(true);
    try {
      const ids = targetRows.map((r) => r.boothAdminId).filter(Boolean) as number[];
      const payload: Record<string, any> = { eventId: selectedEventId };
      if (ids.length > 0) payload.boothAdminIds = ids;

      await authApi.bulkSendBoothAdminLogins(payload);
      const sentIds = new Set(targetRows.map((r) => r.id));
      setRows((prev) =>
        prev.map((r) => (sentIds.has(r.id) ? { ...r, status: "sent" as const } : r))
      );
      alert(`${targetRows.length}개 부스에 로그인 정보가 이메일로 전송되었습니다.`);
    } catch (err: any) {
      alert(err.response?.data?.message || "이메일 전송에 실패했습니다.");
    } finally {
      setIsSending(false);
    }
  };

  const selectedRows = rows.filter((r) => r.selected);
  const allSelected = rows.length > 0 && rows.every((r) => r.selected);
  const selectedEvent = events.find((e) => e.eventId === selectedEventId);

  const statusBadge = (status: BoothRow["status"]) => {
    switch (status) {
      case "created":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">계정생성</span>;
      case "sent":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700">전송완료</span>;
      case "error":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">오류</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-500">대기</span>;
    }
  };

  if (isChecking) return <div className="min-h-screen bg-[#F1F3F5]" />;

  return (
    <div className="min-h-screen bg-[#F1F3F5] flex flex-col">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="h-24 bg-[#2D2A4A] flex items-center justify-between px-10 text-white shrink-0 shadow-lg relative z-50">
        <div className="w-[200px]" />

        <Link href="/" className="flex flex-col items-center justify-center hover:opacity-80 transition-opacity">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold tracking-tight">
            <Image src="/super/assets/logo.png" alt="줄서잇 매니저 로고" width={100} height={24} className="h-6 w-auto object-contain" priority />
            줄서잇 매니저
          </div>
          <p className="mt-1 text-xs text-gray-300 font-medium opacity-80">부스 운영을 스마트하고 간편하게</p>
        </Link>

        <div className="flex items-center gap-6 w-[220px] justify-end">
          {/* Timer */}
          <div className="flex items-center gap-3 bg-white/5 pl-4 pr-1.5 py-1.5 rounded-2xl border border-white/10 shadow-inner">
            <span className={`text-[15px] font-black tabular-nums transition-colors ${timeLeft < 300 ? "text-red-400 animate-pulse" : "text-[#C4FF00]"}`}>
              {formatTime(timeLeft)}
            </span>
            <button onClick={handleRefresh} className="px-3 py-1 bg-[#C4FF00] text-[#2D2A4A] rounded-xl text-[11px] font-extrabold hover:bg-[#bcfd00] transition-all whitespace-nowrap">
              연장
            </button>
          </div>

          <div className="flex items-center gap-1 text-gray-400 border-l border-white/10 pl-5">
            <Link href="/settings" title="설정" className="hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10">
              <Settings className="w-5 h-5" />
            </Link>
            <button title="로그아웃" onClick={handleLogout} className="hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 pt-10 pb-24 flex flex-col gap-6">

        {/* Page title + nav */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#2D2A4A] rounded-xl">
                <Users className="w-5 h-5 text-[#C4FF00]" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">부스 관리자 계정 관리</h1>
            </div>
            <p className="mt-1 ml-12 text-sm text-gray-500">CSV/XLSX 파일로 부스 목록을 불러와 계정을 생성하고 이메일로 전송하세요</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-gray-700">{userName}님, 환영합니다.</span>
          </div>
        </div>

        {/* ── Step 1: Event Select ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2D2A4A] text-white text-xs font-black">1</span>
            <h2 className="text-base font-bold text-gray-900">행사 선택</h2>
          </div>
          <div className="relative w-full max-w-sm">
            <button
              onClick={() => setIsEventDropdownOpen((p) => !p)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#F4F5F7] rounded-xl text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <span className={selectedEvent ? "text-gray-900" : "text-gray-400"}>
                {selectedEvent ? selectedEvent.name : "행사를 선택하세요"}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isEventDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {isEventDropdownOpen && (
              <div className="absolute top-full mt-1 left-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400">등록된 행사가 없습니다.</p>
                ) : (
                  events.map((ev) => (
                    <button
                      key={ev.eventId}
                      onClick={() => { setSelectedEventId(ev.eventId); setIsEventDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-gray-50 ${selectedEventId === ev.eventId ? "text-[#2D2A4A] font-bold bg-indigo-50" : "text-gray-700"}`}
                    >
                      {ev.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Step 2: File Upload ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2D2A4A] text-white text-xs font-black">2</span>
            <h2 className="text-base font-bold text-gray-900">파일 업로드</h2>
            <span className="ml-auto text-xs text-red-500 font-medium">필수 컬럼: 부스명 (name), 이메일 (email)</span>
          </div>
          <div
            className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all ${isDragging
              ? "border-[#2D2A4A] bg-indigo-50 scale-[1.01]"
              : "border-gray-200 hover:border-[#2D2A4A] hover:bg-gray-50"
              }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onInputChange} />
            {isParsing ? (
              <Loader2 className="w-10 h-10 text-[#2D2A4A] animate-spin" />
            ) : (
              <>
                <div className={`p-4 rounded-2xl transition-colors ${isDragging ? "bg-[#2D2A4A]" : "bg-[#F4F5F7]"}`}>
                  <FileSpreadsheet className={`w-8 h-8 ${isDragging ? "text-[#C4FF00]" : "text-[#2D2A4A]"}`} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-700">
                    {fileName ? `📄 ${fileName}` : "파일을 드래그하거나 클릭하여 업로드"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">CSV, XLSX, XLS 형식 지원</p>
                </div>
                {!fileName && (
                  <div className="flex items-center gap-2 px-5 py-2 bg-[#2D2A4A] text-white text-sm font-bold rounded-xl hover:bg-[#3A375C] transition-colors">
                    <Upload className="w-4 h-4" />
                    파일 선택
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Step 3: Table ───────────────────────────────────────────────── */}
        {rows.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Table header bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2D2A4A] text-white text-xs font-black">3</span>
                <h2 className="text-base font-bold text-gray-900">부스 목록</h2>
                <span className="ml-2 px-2.5 py-0.5 bg-[#F4F5F7] rounded-full text-xs font-bold text-gray-600">{rows.length}개</span>
                <span className="text-xs text-gray-400">/ 선택 {selectedRows.length}개</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPasswords((p) => !p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPasswords ? "비밀번호 숨기기" : "비밀번호 보기"}
                </button>
                <button
                  onClick={regenAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  전체 재생성
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8F9FA] text-gray-500 text-xs font-bold uppercase tracking-wider">
                    <th className="w-12 px-4 py-3 text-center">
                      <button onClick={toggleAll} className="flex items-center justify-center">
                        {allSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#2D2A4A]" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">부스명</th>
                    <th className="px-4 py-3 text-left">이메일</th>
                    <th className="px-4 py-3 text-left">아이디 (자동생성)</th>
                    <th className="px-4 py-3 text-left">비밀번호</th>
                    <th className="px-4 py-3 text-center">상태</th>
                    <th className="px-4 py-3 text-center">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((row) => (
                    <tr key={row.id} className={`transition-colors ${row.selected ? "bg-indigo-50/30" : "bg-white"} hover:bg-gray-50`}>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleRow(row.id)} className="flex items-center justify-center">
                          {row.selected ? (
                            <CheckSquare className="w-4 h-4 text-[#2D2A4A]" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-300" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{row.boothName}</td>
                      <td className="px-4 py-3 text-gray-600">{row.email}</td>
                      <td className="px-4 py-3">
                        <code className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono text-[#2D2A4A]">
                          {row.loginId}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <code className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono text-gray-600">
                          {showPasswords ? row.password : "•".repeat(row.password.length)}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-center">{statusBadge(row.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            title="자격정보 재생성"
                            onClick={() => regenCredentials(row.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#2D2A4A] transition-colors"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="행 삭제"
                            onClick={() => deleteRow(row.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action buttons bar */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-[#F8F9FA]">
              <p className="text-xs text-gray-500">
                계정을 먼저 생성한 뒤 이메일을 전송하세요.
              </p>
              <div className="flex items-center gap-3">
                {/* 계정 일괄 생성 */}
                <button
                  onClick={handleCreate}
                  disabled={isCreating || rows.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2D2A4A] text-white text-sm font-bold hover:bg-[#3A375C] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  계정 일괄 생성
                </button>

                {/* 선택 이메일 전송 */}
                <button
                  onClick={() => handleSend(selectedRows)}
                  disabled={isSending || selectedRows.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  선택 전송 ({selectedRows.length})
                </button>

                {/* 전체 이메일 전송 */}
                <button
                  onClick={() => handleSend(rows)}
                  disabled={isSending || rows.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C4FF00] text-[#2D2A4A] text-sm font-bold hover:bg-[#bcfd00] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MailCheck className="w-4 h-4" />}
                  전체 전송
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

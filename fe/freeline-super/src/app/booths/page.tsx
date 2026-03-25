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

// Types
interface BoothRow {
  id: string; // internal row id
  boothName: string;
  locationCode: string;
  openTime: string;
  closeTime: string;
  adminName: string;
  adminEmail: string;
  adminCompany: string;
  selected: boolean;
  status: "pending" | "registered" | "error";
}

// ??? Helper: parse CSV/XLSX buffer ? BoothRow[] ??????????????????????????????
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
            const name = r["부스 이름"] || r["부스명"] || r["boothName"] || r["name"] || "";
            const email = r["관리자 이메일"] || r["이메일"] || r["adminEmail"] || r["email"] || "";
            return name.toString().trim() && email.toString().trim();
          })
          .map((r) => ({
            id: crypto.randomUUID(),
            boothName: (r["부스 이름"] || r["boothName"] || r["부스명"] || r["name"] || "").toString().trim(),
            locationCode: (r["부스 위치 코드"] || r["locationCode"] || r["부스 위치"] || r["location"] || "").toString().trim(),
            openTime: (r["운영 시작 시간"] || r["openTime"] || "").toString().trim(),
            closeTime: (r["운영 종료 시간"] || r["closeTime"] || "").toString().trim(),
            adminName: (r["부스 관리자 이름"] || r["adminName"] || "").toString().trim(),
            adminEmail: (r["부스 관리자 이메일"] || r["adminEmail"] || r["이메일"] || r["email"] || "").toString().trim(),
            adminCompany: (r["부스 관리자 소속/회사명"] || r["adminCompany"] || r["소속"] || "").toString().trim(),
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading states
  const [isCreating, setIsCreating] = useState(false);

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

  // ── Fetch booths ────────────────────────────────────────────────────────
  const fetchBooths = useCallback(async (id: number | string) => {
    try {
      const res = await eventApi.getBooths(id);
      if (res.data?.success && Array.isArray(res.data.data)) {
        const mapped: BoothRow[] = res.data.data.map((b: any) => ({
          id: b.boothId.toString(),
          boothName: b.boothName || "",
          locationCode: b.locationCode || "",
          openTime: b.openTime || "",
          closeTime: b.closeTime || "",
          adminName: b.adminName || "",
          adminEmail: b.adminEmail || "",
          adminCompany: b.adminCompany || "",
          selected: true,
          status: "registered" as const,
        }));
        setRows(mapped);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchBooths(selectedEventId);
    } else {
      setRows([]);
    }
  }, [selectedEventId, fetchBooths]);

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
    setSelectedFile(file);
    setFileName(file.name);
    setIsParsing(true);
    try {
      const parsed = await parseFile(file);
      if (parsed.length === 0) {
        alert("파일에서 데이터를 찾을 수 없습니다.\n필수 컬럼: 부스 이름, 관리자 이메일을 확인해 주세요.");
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
    if (rows.length <= 1) {
      setSelectedFile(null);
      setFileName("");
    }
  };

  // ── API actions ───────────────────────────────────────────────────────────
  // API actions
  const handleOnboarding = async () => {
    if (!selectedEventId) { alert("행사를 먼저 선택해주세요."); return; }
    if (!selectedFile) { alert("업로드할 파일을 선택해주세요."); return; }

    setIsCreating(true);
    try {
      const res = await eventApi.onboardBooths(selectedEventId, selectedFile);
      if (res.data?.success || res.status === 201) {
        alert("부스 및 관리자 정보가 성공적으로 등록되었습니다.\n다음 단계인 ID/PW 생성을 진행할 수 있습니다.");
        await fetchBooths(selectedEventId);
        setSelectedFile(null);
        setFileName("");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "테이블 등록에 실패했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  const selectedRows = rows.filter((r) => r.selected);
  const allSelected = rows.length > 0 && rows.every((r) => r.selected);
  const selectedEvent = events.find((e) => e.eventId === selectedEventId);

  const statusBadge = (status: BoothRow["status"]) => {
    switch (status) {
      case "registered":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700">등록완료</span>;
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
              <h1 className="text-2xl font-bold text-gray-900">부스 관리자 계정 생성</h1>
            </div>
            <p className="mt-1 ml-12 text-sm text-gray-500">CSV/XLSX 파일로 부스 및 관리자 정보를 일괄 등록하고 계정을 생성하세요</p>
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
          </div>

          {/* Example Template Table */}
          <div className="mb-5 overflow-x-auto">
            <p className="text-[11px] font-bold text-gray-400 mb-2 ml-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              업로드 양식 예시 (CSV/XLSX)
            </p>
            <table className="w-full text-[11px] border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                  <th className="px-4 py-3 text-left border-r border-gray-100 whitespace-nowrap">부스 이름</th>
                  <th className="px-4 py-3 text-left border-r border-gray-100 whitespace-nowrap">부스 위치 코드</th>
                  <th className="px-4 py-3 text-left border-r border-gray-100 whitespace-nowrap">운영 시작</th>
                  <th className="px-4 py-3 text-left border-r border-gray-100 whitespace-nowrap">운영 종료</th>
                  <th className="px-4 py-3 text-left border-r border-gray-100 whitespace-nowrap">관리자 이름</th>
                  <th className="px-4 py-3 text-left border-r border-gray-100 whitespace-nowrap">관리자 이메일</th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">소속/회사명</th>
                </tr>
              </thead>
              <tbody className="text-gray-400 bg-white">
                <tr>
                  <td className="px-4 py-3 border-r border-gray-100 font-medium">A-01 부스</td>
                  <td className="px-4 py-3 border-r border-gray-100">A-01</td>
                  <td className="px-4 py-3 border-r border-gray-100">10:00:00</td>
                  <td className="px-4 py-3 border-r border-gray-100">18:00:00</td>
                  <td className="px-4 py-3 border-r border-gray-100">홍길동</td>
                  <td className="px-4 py-3 border-r border-gray-100 text-[#2D2A4A]/60">booth@test.com</td>
                  <td className="px-4 py-3">줄서잇 컴퍼니</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2.5 text-[11px] text-gray-400 flex items-center gap-1">
              <span className="text-red-400 font-bold">*</span>
              부스 이름과 관리자 이메일은 필수 항목입니다. (헤더 명칭이 달라도 의미가 유사하면 자동으로 인식됩니다.)
            </p>
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
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">관리자 정보 포함</span>
                </div>
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
                    <th className="px-4 py-3 text-left">위치 코드</th>
                    <th className="px-4 py-3 text-left">운영시간</th>
                    <th className="px-4 py-3 text-left">관리자</th>
                    <th className="px-4 py-3 text-left">이메일</th>
                    <th className="px-4 py-3 text-left">소속</th>
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
                      <td className="px-4 py-3 text-gray-600">{row.locationCode}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {row.openTime} ~ {row.closeTime}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{row.adminName}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{row.adminEmail}</td>
                      <td className="px-4 py-3 text-gray-600 text-[10px]">{row.adminCompany}</td>
                      <td className="px-4 py-3 text-center">{statusBadge(row.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
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
              <p className="text-xs text-gray-500 font-medium">
                <span className="text-[#2D2A4A] font-bold">Step 1:</span> CSV 파일을 업로드하여 부스 및 관리자 정보를 테이블에 일괄 등록합니다.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleOnboarding}
                  disabled={isCreating || rows.length === 0}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2D2A4A] text-white text-sm font-bold hover:bg-[#3A375C] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md group"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />}
                  테이블 일괄 등록 (Onboarding)
                </button>

                <div className="h-4 w-[1px] bg-gray-300 mx-2" />

                <button
                  disabled
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-400 text-sm font-bold cursor-not-allowed transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  ID/PW 일괄 생성 (대기)
                </button>

                <button
                  disabled
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-400 text-sm font-bold cursor-not-allowed transition-all"
                >
                  <Mail className="w-4 h-4" />
                  이메일 일괄 전송 (대기)
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { Sidebar } from "@/components/Sidebar";
import { authApi } from "@/lib/api/auth";
import { eventApi, Event } from "@/lib/api/event";
import {
  Upload,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Mail,
  MailCheck,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Users,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface BoothRow {
  id: string;
  boothName: string;
  email: string;
  loginId: string;
  password: string;
  selected: boolean;
  status: "pending" | "created" | "sent" | "error";
  boothAdminId?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const SPECIALS = "!@#$%^&*";

function genLoginId() {
  return (
    "booth_" +
    Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("")
  );
}

function genPassword() {
  const pool = CHARS + SPECIALS;
  const arr = Array.from({ length: 10 }, () => pool[Math.floor(Math.random() * pool.length)]);
  arr[Math.floor(Math.random() * 10)] = SPECIALS[Math.floor(Math.random() * SPECIALS.length)];
  return arr.join("");
}

function parseFile(file: File): Promise<BoothRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const rows: BoothRow[] = json
          .map((r) => ({
            boothName: (r["부스명"] || r["name"] || r["booth_name"] || "").trim(),
            email: (r["이메일"] || r["email"] || r["Email"] || "").trim(),
          }))
          .filter((r) => r.boothName && r.email)
          .map((r) => ({
            id: crypto.randomUUID(),
            ...r,
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EventBoothsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const router = useRouter();

  const [userName, setUserName] = useState("관리자");
  const [event, setEvent] = useState<Event | null>(null);

  const [rows, setRows] = useState<BoothRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [userRes, eventRes] = await Promise.all([
          authApi.getMe(),
          eventApi.getEvent(eventId),
        ]);
        if (userRes.data?.success && userRes.data?.data?.name)
          setUserName(userRes.data.data.name);
        const detail = eventRes.data?.success ? eventRes.data.data : (eventRes.data as any);
        if (detail?.eventId) setEvent(detail as Event);
      } catch {
        /* ignore */
      }
    };
    if (eventId) load();
  }, [eventId]);

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
        alert(
          "데이터를 찾을 수 없습니다.\n필수 컬럼: 부스명 (name), 이메일 (email)"
        );
      }
      setRows((prev) => [...prev, ...parsed]);
    } catch {
      alert("파일 파싱에 실패했습니다.");
    } finally {
      setIsParsing(false);
    }
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  // ── Row actions ───────────────────────────────────────────────────────────
  const toggleAll = () => {
    const allSelected = rows.every((r) => r.selected);
    setRows((p) => p.map((r) => ({ ...r, selected: !allSelected })));
  };
  const toggleRow = (id: string) =>
    setRows((p) => p.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)));
  const deleteRow = (id: string) =>
    setRows((p) => p.filter((r) => r.id !== id));
  const regenOne = (id: string) =>
    setRows((p) =>
      p.map((r) => (r.id === id ? { ...r, loginId: genLoginId(), password: genPassword() } : r))
    );
  const regenAll = () =>
    setRows((p) => p.map((r) => ({ ...r, loginId: genLoginId(), password: genPassword() })));
  const clearAll = () => {
    setRows([]);
    setFileName("");
  };

  // ── API actions ───────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (rows.length === 0) { alert("업로드된 데이터가 없습니다."); return; }
    setIsCreating(true);
    try {
      const res = await authApi.bulkCreateBoothAdmins({
        eventId: Number(eventId),
        booths: rows.map((r) => ({
          boothName: r.boothName,
          loginId: r.loginId,
          password: r.password,
          email: r.email,
        })),
      });
      const created = res.data?.data;
      setRows((p) =>
        p.map((r, i) => ({
          ...r,
          status: "created" as const,
          boothAdminId: Array.isArray(created)
            ? (created[i]?.boothAdminId ?? created[i]?.id)
            : undefined,
        }))
      );
      alert(`${rows.length}개 부스 관리자 계정이 성공적으로 생성되었습니다.`);
    } catch (err: any) {
      alert(err.response?.data?.message || "계정 생성에 실패했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSend = async (targetRows: BoothRow[]) => {
    if (targetRows.length === 0) { alert("선택된 부스가 없습니다."); return; }
    setIsSending(true);
    try {
      const ids = targetRows.map((r) => r.boothAdminId).filter(Boolean) as number[];
      const payload: Record<string, any> = { eventId: Number(eventId) };
      if (ids.length > 0) payload.boothAdminIds = ids;
      await authApi.bulkSendBoothAdminLogins(payload);
      const sentIds = new Set(targetRows.map((r) => r.id));
      setRows((p) =>
        p.map((r) => (sentIds.has(r.id) ? { ...r, status: "sent" as const } : r))
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

  const statusBadge = (s: BoothRow["status"]) => {
    const map = {
      pending: "bg-gray-100 text-gray-500",
      created: "bg-blue-100 text-blue-700",
      sent: "bg-green-100 text-green-700",
      error: "bg-red-100 text-red-700",
    } as const;
    const label = { pending: "대기", created: "계정생성", sent: "전송완료", error: "오류" } as const;
    return (
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${map[s]}`}>
        {label[s]}
      </span>
    );
  };

  return (
    <div className="flex bg-[#F1F3F5] h-screen overflow-hidden">
      <Sidebar userName={userName} role="총괄 팀장" eventId={eventId} />

      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* ── Page Header ────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 bg-[#F1F3F5] px-8 pt-8 pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#2D2A4A] rounded-xl">
                <Users className="w-5 h-5 text-[#C4FF00]" />
              </div>
              <div>
                <h1 className="text-xl font-black text-[#2D2A4A]">부스 관리자 계정 관리</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {event?.name} · CSV/XLSX 업로드로 계정을 일괄 생성하고 이메일로 전송하세요
                </p>
              </div>
            </div>
            {rows.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-gray-400 hover:text-red-500 font-bold transition-colors"
              >
                목록 초기화
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 p-8 flex flex-col gap-6">
          {/* ── Step 1: Upload ────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2D2A4A] text-white text-xs font-black">
                1
              </span>
              <h2 className="text-sm font-bold text-gray-900">파일 업로드</h2>
              <span className="ml-auto text-xs text-gray-400">
                필수 컬럼: <code className="bg-gray-100 px-1 rounded">부스명</code>{" "}
                <code className="bg-gray-100 px-1 rounded">이메일</code>
              </span>
            </div>
            <div
              className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all ${
                isDragging
                  ? "border-[#2D2A4A] bg-indigo-50 scale-[1.01]"
                  : "border-gray-200 hover:border-[#2D2A4A] hover:bg-gray-50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={onInputChange}
              />
              {isParsing ? (
                <Loader2 className="w-8 h-8 text-[#2D2A4A] animate-spin" />
              ) : (
                <>
                  <div className={`p-3 rounded-2xl ${isDragging ? "bg-[#2D2A4A]" : "bg-[#F4F5F7]"}`}>
                    <FileSpreadsheet
                      className={`w-6 h-6 ${isDragging ? "text-[#C4FF00]" : "text-[#2D2A4A]"}`}
                    />
                  </div>
                  <p className="text-sm font-bold text-gray-700">
                    {fileName ? `📄 ${fileName} (업로드됨)` : "파일을 드래그하거나 클릭하여 업로드"}
                  </p>
                  <p className="text-xs text-gray-400">CSV, XLSX, XLS · 여러 번 업로드 시 행이 추가됩니다</p>
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#2D2A4A] text-white text-xs font-bold rounded-xl">
                    <Upload className="w-3.5 h-3.5" />
                    파일 선택
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Step 2: Table ─────────────────────────────────────── */}
          {rows.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              {/* Table toolbar */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2D2A4A] text-white text-xs font-black">
                    2
                  </span>
                  <h2 className="text-sm font-bold text-gray-900">부스 목록</h2>
                  <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-bold text-gray-600">
                    {rows.length}개
                  </span>
                  <span className="text-xs text-gray-400">/ 선택 {selectedRows.length}개</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPasswords((p) => !p)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    {showPasswords ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showPasswords ? "숨기기" : "비밀번호 보기"}
                  </button>
                  <button
                    onClick={regenAll}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    전체 재생성
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8F9FA] text-gray-500 text-xs font-bold">
                      <th className="w-10 px-4 py-2.5 text-center">
                        <button onClick={toggleAll}>
                          {allSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#2D2A4A] mx-auto" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400 mx-auto" />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-2.5 text-left">부스명</th>
                      <th className="px-4 py-2.5 text-left">이메일</th>
                      <th className="px-4 py-2.5 text-left">아이디</th>
                      <th className="px-4 py-2.5 text-left">비밀번호</th>
                      <th className="px-4 py-2.5 text-center">상태</th>
                      <th className="px-4 py-2.5 text-center">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className={`transition-colors ${row.selected ? "bg-indigo-50/40" : "bg-white"} hover:bg-gray-50`}
                      >
                        <td className="px-4 py-2 text-center">
                          <button onClick={() => toggleRow(row.id)}>
                            {row.selected ? (
                              <CheckSquare className="w-4 h-4 text-[#2D2A4A] mx-auto" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-300 mx-auto" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-2 font-semibold text-gray-900">{row.boothName}</td>
                        <td className="px-4 py-2 text-gray-500 text-xs">{row.email}</td>
                        <td className="px-4 py-2">
                          <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono text-[#2D2A4A]">
                            {row.loginId}
                          </code>
                        </td>
                        <td className="px-4 py-2">
                          <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono text-gray-500">
                            {showPasswords ? row.password : "•".repeat(row.password.length)}
                          </code>
                        </td>
                        <td className="px-4 py-2 text-center">{statusBadge(row.status)}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              title="재생성"
                              onClick={() => regenOne(row.id)}
                              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#2D2A4A] transition-colors"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              title="삭제"
                              onClick={() => deleteRow(row.id)}
                              className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
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

              {/* Action bar */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-[#F8F9FA]">
                <p className="text-xs text-gray-400">
                  ① 계정 일괄 생성 후 ② 이메일 전송 순으로 진행하세요
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={isCreating || rows.length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2D2A4A] text-white text-xs font-bold hover:bg-[#3A375C] disabled:opacity-50 transition-all shadow-sm"
                  >
                    {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
                    계정 일괄 생성
                  </button>
                  <button
                    onClick={() => handleSend(selectedRows)}
                    disabled={isSending || selectedRows.length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
                  >
                    {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                    선택 전송 ({selectedRows.length})
                  </button>
                  <button
                    onClick={() => handleSend(rows)}
                    disabled={isSending || rows.length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C4FF00] text-[#2D2A4A] text-xs font-bold hover:bg-[#bcfd00] disabled:opacity-50 transition-all shadow-sm"
                  >
                    {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MailCheck className="w-3.5 h-3.5" />}
                    전체 전송
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

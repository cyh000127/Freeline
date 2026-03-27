"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {useParams} from "next/navigation";
import * as XLSX from "xlsx";
import { Sidebar } from "@/components/Sidebar";
import { authApi } from "@/lib/api/auth";
import { eventApi, Event } from "@/lib/api/event";
import { useModal } from "@/context/ModalContext";
import {
  Upload,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Mail,
  Loader2,
  Trash2,
  Users,
} from "lucide-react";

interface BoothRow {
  id: string;
  adminId?: number;
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

type BoothSheetCell = string | number | null | undefined;
type BoothSheetRow = BoothSheetCell[];

interface BoothAdminRecord {
  adminId?: number;
  boothId?: number;
  boothName?: string;
  name?: string;
  email?: string;
  company?: string;
}

interface BoothDetailRecord {
  boothId?: number;
  locationCode?: string;
  openTime?: string;
  closeTime?: string;
}

interface ApiErrorShape {
  response?: {
    data?: {
      message?: string;
      status?: string;
      error?: {
        status?: string;
      };
    };
  };
  message?: string;
}

const normalizeBoothName = (name: string) => name.trim().toLowerCase();
const getCellText = (row: BoothSheetRow, index: number) => String(row[index] ?? "").trim();
const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiErrorShape;
  return apiError.response?.data?.message || apiError.message || fallback;
};

const buildBoothRows = (dataRows: BoothSheetRow[]): BoothRow[] =>
    dataRows
        .slice(1)
        .filter((row) => getCellText(row, 0) && getCellText(row, 5))
        .map((row) => ({
          id: crypto.randomUUID(),
          boothName: getCellText(row, 0),
          locationCode: getCellText(row, 1),
          openTime: getCellText(row, 2),
          closeTime: getCellText(row, 3),
          adminName: getCellText(row, 4),
          adminEmail: getCellText(row, 5),
          adminCompany: getCellText(row, 6),
          selected: true,
          status: "pending" as const,
        }));

async function parseFile(file: File): Promise<BoothRow[]> {
  const data = await file.arrayBuffer();
  const isCsv = file.name.toLowerCase().endsWith(".csv");

  const workbook = (() => {
    if (!isCsv) {
      return XLSX.read(data, {type: "array"});
    }

    try {
      const utf8Decoder = new TextDecoder("utf-8", {fatal: true});
      const content = utf8Decoder.decode(new Uint8Array(data));
      return XLSX.read(content, {type: "string"});
    } catch {
      const eucDecoder = new TextDecoder("euc-kr");
      const content = eucDecoder.decode(new Uint8Array(data));
      return XLSX.read(content, {type: "string"});
    }
  })();

  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const dataRows = XLSX.utils.sheet_to_json<BoothSheetRow>(worksheet, {
    header: 1,
    defval: "",
  });

  return buildBoothRows(dataRows);
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EventBoothsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { showAlert, showConfirm } = useModal();

  const [userName, setUserName] = useState("관리자");
  const [event, setEvent] = useState<Event | null>(null);

  const [rows, setRows] = useState<BoothRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSendingMail, setIsSendingMail] = useState(false);

  const fetchBooths = useCallback(async () => {
    try {
      const [adminsRes, detailsRes] = await Promise.all([
        eventApi.getBooths(eventId),
        eventApi.getBoothDetails(eventId),
      ]);

      const detailsMap = new Map<string, BoothDetailRecord>();
      if (detailsRes.data?.success && Array.isArray(detailsRes.data.data)) {
        detailsRes.data.data.forEach((detail: BoothDetailRecord) => {
          if (detail.boothId) detailsMap.set(detail.boothId.toString(), detail);
        });
      }

      if (adminsRes.data?.success && Array.isArray(adminsRes.data.data)) {
        const existingRows: BoothRow[] = adminsRes.data.data.map((admin: BoothAdminRecord) => {
          const detail = admin.boothId ? detailsMap.get(admin.boothId.toString()) : null;
          return {
            id: admin.boothId ? admin.boothId.toString() : crypto.randomUUID(),
            adminId: admin.adminId,
            boothName: admin.boothName || "",
            locationCode: detail?.locationCode || "-",
            openTime: detail?.openTime || "-",
            closeTime: detail?.closeTime || "-",
            adminName: admin.name || "",
            adminEmail: admin.email || "",
            adminCompany: admin.company || "-",
            selected: false,
            status: "registered" as const,
          };
        });
        setRows(existingRows);
      }
    } catch {
      /* ignore */
    }
  }, [eventId]);

  useEffect(() => {
    const load = async () => {
      try {
        const [userRes, eventRes] = await Promise.all([
          authApi.getMe(),
          eventApi.getEvent(eventId),
        ]);
        if (userRes.data?.success && userRes.data?.data?.name)
          setUserName(userRes.data.data.name);
        const detail = eventRes.data?.success
            ? eventRes.data.data
            : typeof eventRes.data === "object" && eventRes.data !== null
                ? eventRes.data
                : null;
        if (detail && typeof detail === "object" && "eventId" in detail) {
          setEvent(detail as Event);
        }

        await fetchBooths();
      } catch {
        /* ignore */
      }
    };
    if (eventId) load();
  }, [eventId, fetchBooths]);

  const handleFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext || "")) {
      showAlert("CSV 또는 XLSX 파일만 업로드 가능합니다.");
      return;
    }
    setIsParsing(true);
    try {
      const parsed = await parseFile(file);
      if (parsed.length === 0) {
        showAlert(
          "데이터를 찾을 수 없습니다.\n필수 컬럼: 부스 이름, 관리자 이메일을 확인해 주세요."
        );
      }

      const seenBoothNames = new Set(rows.map((row) => normalizeBoothName(row.boothName)));
      const duplicateBoothNames = new Set<string>();

      for (const row of parsed) {
        const normalizedName = normalizeBoothName(row.boothName);
        if (seenBoothNames.has(normalizedName)) {
          duplicateBoothNames.add(row.boothName.trim());
          continue;
        }
        seenBoothNames.add(normalizedName);
      }

      if (duplicateBoothNames.size > 0) {
        const duplicateList = Array.from(duplicateBoothNames).join(", ");
        showAlert(`동일 이벤트 내 중복 부스명은 등록할 수 없습니다.\n중복 이름: ${duplicateList}`);
        return;
      }

      setFileName(file.name);
      setSelectedFile(file);
      setRows((prev) => [...prev, ...parsed]);
    } catch {
      showAlert("파일 파싱에 실패했습니다.");
    } finally {
      setIsParsing(false);
    }
  };

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
    setRows((prev) => prev.map((r) => ({ ...r, selected: !allSelected })));
  };

  const toggleRow = (id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)));
  };

  const deleteRow = async (id: string) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;

    if (row.adminId) {
      showConfirm(`부스 관리자 '${row.adminName}' 계정을 정말로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`, async () => {
        try {
          const res = await authApi.deleteBoothAdmin(row.adminId!);
          if (res.data?.success || res.status === 200 || res.status === 204) {
            setRows((p) => p.filter((r) => r.id !== id));
            showAlert("성공적으로 삭제되었습니다.");
          }
        } catch (error) {
          showAlert(getErrorMessage(error, "삭제에 실패했습니다."));
        }
      });
    } else {
      setRows((p) => p.filter((r) => r.id !== id));
    }

    if (rows.length <= 1) {
      setSelectedFile(null);
      setFileName("");
    }
  };
  const clearAll = () => {
    setRows([]);
    setSelectedFile(null);
    setFileName("");
  };

  // ───── API actions ─────────────────────────────────────────────────────────
  const handleOnboarding = async () => {
    if (!selectedFile) { showAlert("업로드할 파일을 선택해주세요."); return; }
    setIsCreating(true);
    try {
      const res = await eventApi.onboardBooths(eventId, selectedFile);
      if (res.data?.success || res.status === 201) {
        showAlert("계정이 성공적으로 일괄 생성되었습니다.\n이제 '이메일 일괄 전송'을 통해 계정 정보를 발송할 수 있습니다.");
        await fetchBooths();
        setSelectedFile(null);
        setFileName("");
      }
    } catch (error) {
      const apiError = error as ApiErrorShape;
      const errorStatus = apiError.response?.data?.status || apiError.response?.data?.error?.status;
      if (errorStatus === "INVALID_CSV_FORMAT") {
        showAlert("파일 형식이 올바르지 않거나 컬럼 양식이 다릅니다. 정상적인 CSV 파일인지 확인해 주세요.");
      } else {
        showAlert(getErrorMessage(error, "테이블 등록에 실패했습니다."));
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendMail = async () => {
    const selected = rows.filter((r) => r.selected && r.status === "registered" && r.adminId);
    if (selected.length === 0) {
      showAlert("이메일을 발송할 관리자(등록완료 상태)를 선택해주세요.");
      return;
    }
    
    showConfirm(`선택한 ${selected.length}명의 부스 관리자에게 로그인 정보를 전송하시겠습니까?`, async () => {
      setIsSendingMail(true);
      try {
        const adminIds = selected.map((r) => r.adminId!);
        const res = await eventApi.sendLoginInfo({ boothAdminIds: adminIds });
        if (res.data?.success) {
          showAlert("성공적으로 이메일 전송을 요청했습니다.");
          // optionally refresh UI or clear selection
          setRows((prev) => prev.map((r) => selected.some((s) => s.id === r.id) ? { ...r, selected: false } : r));
        }
      } catch (error) {
        showAlert(getErrorMessage(error, "이메일 전송에 실패했습니다."));
      } finally {
        setIsSendingMail(false);
      }
    });
  };

  const allSelected = rows.length > 0 && rows.every((r) => r.selected);
  const selectedRows = rows.filter((r) => r.selected);

  const statusBadge = (s: BoothRow["status"]) => {
    const map = {
      pending: "bg-gray-100 text-gray-500",
      registered: "bg-green-100 text-green-700",
      error: "bg-red-100 text-red-700",
    } as const;
    const label = { pending: "대기", registered: "등록완료", error: "오류" } as const;
    return (
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${map[s]}`}>
        {label[s as keyof typeof label]}
      </span>
    );
  };

  return (
    <div className="flex bg-[#F1F3F5] h-screen overflow-hidden">
      <Sidebar userName={userName} role="총괄 팀장" eventId={eventId} eventName={event?.name}/>

      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* ── Page Header ────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 bg-[#F1F3F5] px-8 pt-8 pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 [&>div:last-child>*]:hidden">
              <div className="rounded-xl bg-[#2D2A4A] p-2 shadow-lg">
                <Users className="h-6 w-6 text-[#C4FF00]"/>
              </div>
              <div className="flex flex-col">
                <h1 className="text-3xl font-black tracking-tight text-[#2D2A4A]">부스 계정 관리</h1>
                <p className="ml-1 font-medium text-gray-500">
                  {(event?.name || "행사")}의 부스 관리자 계정을 등록하고 로그인 정보를 전송합니다.
                </p>
              </div>
              <div>
                <h1 className="text-xl font-black text-[#2D2A4A]">부스 관리자 계정 생성</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {event?.name} · CSV/XLSX 정보를 일괄 등록하고 계정을 생성하세요
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
            </div>

            {/* Example Template Table */}
            <div className="mb-5 overflow-x-auto">
              <p className="text-[11px] font-bold text-gray-400 mb-2 ml-1 flex items-center gap-1.5">
                <span className="wy-1 h-1 rounded-full bg-red-400"></span>
                업로드 양식 예시 (CSV/XLSX)
              </p>
              <table className="w-full text-[10px] border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                    <th className="px-4 py-2.5 text-left border-r border-gray-100 whitespace-nowrap">부스 이름</th>
                    <th className="px-4 py-2.5 text-left border-r border-gray-100 whitespace-nowrap">위치 코드</th>
                    <th className="px-4 py-2.5 text-left border-r border-gray-100 whitespace-nowrap">운영 시작</th>
                    <th className="px-4 py-2.5 text-left border-r border-gray-100 whitespace-nowrap">운영 종료</th>
                    <th className="px-4 py-2.5 text-left border-r border-gray-100 whitespace-nowrap">관리자 이름</th>
                    <th className="px-4 py-2.5 text-left border-r border-gray-100 whitespace-nowrap">관리자 이메일</th>
                    <th className="px-4 py-2.5 text-left whitespace-nowrap">소속</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400 bg-white">
                  <tr>
                    <td className="px-4 py-2.5 border-r border-gray-100">A-01 부스</td>
                    <td className="px-4 py-2.5 border-r border-gray-100">A-01</td>
                    <td className="px-4 py-2.5 border-r border-gray-100">10:00:00</td>
                    <td className="px-4 py-2.5 border-r border-gray-100">18:00:00</td>
                    <td className="px-4 py-2.5 border-r border-gray-100">홍길동</td>
                    <td className="px-4 py-2.5 border-r border-gray-100">booth@test.com</td>
                    <td className="px-4 py-2.5">(주)컴퍼니</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-2 text-[10px] text-red-400 italic">
                * 부스 이름과 관리자 이메일은 필수 항목입니다.
              </p>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={onInputChange}
            />
            <button
                type="button"
              className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all ${isDragging
                ? "border-[#2D2A4A] bg-indigo-50 scale-[1.01]"
                : "border-gray-200 hover:border-[#2D2A4A] hover:bg-gray-50"
                }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
                aria-describedby="booth-upload-help"
            >
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
                  <p id="booth-upload-help" className="text-xs text-gray-400">CSV, XLSX, XLS · 중복 부스명은 자동으로 차단됩니다</p>
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#2D2A4A] text-white text-xs font-bold rounded-xl">
                    <Upload className="w-3.5 h-3.5" />
                    파일 선택
                  </div>
                </>
              )}
            </button>
          </div>

          {/* ── Step 2: Table ─────────────────────────────────────── */}
          {rows.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              {/* Table toolbar */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2 [&>h2]:hidden">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2D2A4A] text-white text-xs font-black">
                    2
                  </span>
                  <span className="text-sm font-bold text-gray-900">부스 관리자 목록</span>
                  <h2 className="text-sm font-bold text-gray-900 not-sr-only!">부스 관리자 목록</h2>
                  <h2 className="text-sm font-bold text-gray-900">부스 목록</h2>
                  <h2 className="text-sm font-bold text-gray-900">부스 관리자 목록</h2>
                  <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-bold text-gray-600">
                    {rows.length}개
                  </span>
                </div>
                <p className="hidden text-[11px] text-gray-400 font-medium text-right">
                  <span className="text-[#2D2A4A] font-bold uppercase tracking-widest mr-1">안내:</span>
                  CSV 파일을 업로드하면 정보를 일괄 등록하고 로그인 정보를 발송할 수 있습니다.
                </p>
                <p className="text-[11px] text-gray-400 font-medium text-right">
                  <span className="text-[#2D2A4A] font-bold uppercase tracking-widest mr-1">안내:</span>
                  CSV 파일을 업로드하면 정보를 등록하고 로그인 정보를 발송할 수 있습니다.
                </p>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8F9FA] text-gray-500 text-xs font-bold border-b border-gray-100">
                      <th className="w-12 px-4 py-3 text-center">
                        <button type="button" onClick={toggleAll} className="flex items-center justify-center">
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
                      <tr
                        key={row.id}
                        className={`transition-colors ${row.selected ? "bg-indigo-50/40" : "bg-white"} hover:bg-gray-50`}
                      >
                        <td className="px-4 py-3 text-center">
                          <button type="button" onClick={() => toggleRow(row.id)}
                                  className="flex items-center justify-center">
                            {row.selected ? (
                              <CheckSquare className="w-4 h-4 text-[#2D2A4A]" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-300" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-800">{row.boothName}</td>
                        <td className="px-4 py-2 text-gray-500 text-xs">{row.locationCode}</td>
                        <td className="px-4 py-2 text-gray-400 text-[10px]">
                          {row.openTime} ~ {row.closeTime}
                        </td>
                        <td className="px-4 py-2 text-gray-600 text-xs">{row.adminName}</td>
                        <td className="px-4 py-2 text-gray-600 font-medium text-xs">{row.adminEmail}</td>
                        <td className="px-4 py-2 text-gray-400 text-[10px]">{row.adminCompany}</td>
                        <td className="px-4 py-2 text-center">{statusBadge(row.status)}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                                type="button"
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
              <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 bg-[#F8F9FA]">
                <p className="hidden text-[11px] text-gray-400 font-medium">
                  <span className="text-[#2D2A4A] font-bold uppercase tracking-widest mr-1">안내:</span> CSV 파일을 업로드하여 정보를 일괄 등록하고 로그인 정보를 발송하세요.
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleOnboarding}
                    disabled={isCreating || rows.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2D2A4A] text-white text-[0px] font-bold hover:bg-[#3A375C] disabled:opacity-50 transition-all shadow-md active:scale-95 group [&>span:not(.visible-label-next)]:hidden"
                  >
                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />}
                    <span className="visible-label-next text-xs">등록 및 ID/PW 생성</span>
                    <span className="visible-label text-xs">등록 및 ID/PW 생성</span>
                    일괄 등록 및 ID/PW 생성
                  </button>

                  <div className="h-4 w-[1px] bg-gray-300" />

                  <button
                    onClick={handleSendMail}
                    disabled={isSendingMail || selectedRows.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C4FF00] text-[#2D2A4A] text-[0px] font-bold hover:bg-[#bcfd00] disabled:opacity-50 transition-all shadow-md active:scale-95 [&>span:not(.visible-label-next)]:hidden"
                  >
                    {isSendingMail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                    <span className="visible-label-next text-xs">이메일 전송</span>
                    <span className="visible-label text-xs">이메일 전송</span>
                    이메일 일괄 전송
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

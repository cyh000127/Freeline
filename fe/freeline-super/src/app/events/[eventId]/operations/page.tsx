"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  Radio,
  RefreshCcw,
  Bell,
  CheckCircle2,
  XCircle,
  LogOut,
  Users,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { authApi } from "@/lib/api/auth";
import { eventApi, Event } from "@/lib/api/event";
import { superWaitingApi, WaitingInfo, DashboardResponse } from "@/lib/api/waiting";
import { useModal } from "@/context/ModalContext";

type BoothOption = {
  boothId: number;
  boothName: string;
  locationCode: string;
};

type QueueTab = "WAITING" | "ENTERED" | "DONE";

const isWaitingLike = (status: string) =>
  status === "REGISTERED" || status === "WAITING" || status === "CALLED";

function extractApiErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    fallback
  );
}

export default function EventOperationsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { showAlert, showConfirm } = useModal();

  const [userName, setUserName] = useState("관리자");
  const [event, setEvent] = useState<Event | null>(null);
  const [booths, setBooths] = useState<BoothOption[]>([]);
  const [selectedBoothId, setSelectedBoothId] = useState<number | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardResponse["data"] | null>(null);
  const [fullQueue, setFullQueue] = useState<WaitingInfo[]>([]);
  const [activeTab, setActiveTab] = useState<QueueTab>("WAITING");
  const [isLoading, setIsLoading] = useState(true);
  const [isQueueLoading, setIsQueueLoading] = useState(false);
  const boothStorageKey = useMemo(() => `super:selectedBooth:${eventId}`, [eventId]);

  const fetchBooths = useCallback(async () => {
    const detailsRes = await eventApi.getBoothDetails(eventId);
    if (!detailsRes.data?.success || !Array.isArray(detailsRes.data.data)) {
      setBooths([]);
      return;
    }

    const nextBooths = detailsRes.data.data
      .filter((booth: any) => booth?.boothId)
      .map((booth: any) => ({
        boothId: booth.boothId,
        boothName: booth.name || `부스 ${booth.boothId}`,
        locationCode: booth.locationCode || "-",
      }));

    setBooths(nextBooths);
    setSelectedBoothId((prev) => {
      const savedBoothId =
        typeof window !== "undefined"
          ? Number(window.localStorage.getItem(boothStorageKey))
          : null;

      if (prev && nextBooths.some((booth) => booth.boothId === prev)) {
        return prev;
      }
      if (
        savedBoothId &&
        nextBooths.some((booth) => booth.boothId === savedBoothId)
      ) {
        return savedBoothId;
      }
      return nextBooths[0]?.boothId ?? null;
    });
  }, [boothStorageKey, eventId]);

  const fetchQueueData = useCallback(
    async (boothId: number, withLoading = false) => {
      if (withLoading) setIsLoading(true);
      setIsQueueLoading(true);
      try {
        const [dashRes, queueRes] = await Promise.all([
          superWaitingApi.getDashboard(boothId),
          superWaitingApi.getQueue(boothId),
        ]);

        if (dashRes.success && dashRes.data) {
          setDashboardData(dashRes.data);
        }
        if (queueRes.success && queueRes.data) {
          setFullQueue(queueRes.data.queueList || []);
        }
      } catch (error: any) {
        showAlert(error?.response?.data?.message || "부스 운영 현황을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
        setIsQueueLoading(false);
      }
    },
    [showAlert]
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [userRes, eventRes] = await Promise.all([
          authApi.getMe(),
          eventApi.getEvent(eventId),
        ]);

        if (userRes.data?.success && userRes.data?.data?.name) {
          setUserName(userRes.data.data.name);
        }
        if (eventRes.data?.success && eventRes.data?.data) {
          setEvent(eventRes.data.data);
        }

        await fetchBooths();
      } catch {
        setIsLoading(false);
      }
    };

    if (eventId) {
      load();
    }
  }, [eventId, fetchBooths]);

  useEffect(() => {
    if (!selectedBoothId) {
      setIsLoading(false);
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(boothStorageKey, String(selectedBoothId));
    }

    fetchQueueData(selectedBoothId, true);
    const interval = setInterval(() => {
      fetchQueueData(selectedBoothId, false);
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedBoothId, fetchQueueData, boothStorageKey]);

  const handleRefresh = async () => {
    if (!selectedBoothId) return;
    await fetchQueueData(selectedBoothId, true);
  };

  const handleCallNext = async () => {
    if (!selectedBoothId) return;
    try {
      await superWaitingApi.callNext(selectedBoothId);
      showAlert("다음 대기자를 호출했습니다.");
      fetchQueueData(selectedBoothId, false);
    } catch (error: any) {
      showAlert(extractApiErrorMessage(error, "다음 대기자 호출에 실패했습니다."));
    }
  };

  const handleAdmit = async (waitingId: number) => {
    if (!selectedBoothId) return;
    try {
      await superWaitingApi.admitWaiting(selectedBoothId, waitingId);
      fetchQueueData(selectedBoothId, false);
    } catch (error: any) {
      showAlert(extractApiErrorMessage(error, "입장 처리에 실패했습니다."));
    }
  };

  const handleCancel = async (waitingId: number) => {
    if (!selectedBoothId) return;
    showConfirm("이 대기를 취소하시겠습니까?", async () => {
      try {
        await superWaitingApi.cancelWaiting(selectedBoothId, waitingId);
        fetchQueueData(selectedBoothId, false);
      } catch (error: any) {
        showAlert(extractApiErrorMessage(error, "대기 취소에 실패했습니다."));
      }
    });
  };

  const handleExit = async (waitingId: number) => {
    if (!selectedBoothId) return;
    try {
      await superWaitingApi.exitWaiting(selectedBoothId, waitingId);
      fetchQueueData(selectedBoothId, false);
    } catch (error: any) {
      showAlert(extractApiErrorMessage(error, "퇴장 처리에 실패했습니다."));
    }
  };

  const queueCounts = useMemo(
    () => ({
      waiting: fullQueue.filter((item) => isWaitingLike(item.status)).length,
      entered: fullQueue.filter((item) => item.status === "ENTERED").length,
      done: fullQueue.filter((item) =>
        item.status === "EXITED" || item.status === "CANCELLED"
      ).length,
    }),
    [fullQueue]
  );

  const filteredQueue = useMemo(() => {
    if (activeTab === "WAITING") {
      return fullQueue.filter((item) => isWaitingLike(item.status));
    }
    if (activeTab === "ENTERED") {
      return fullQueue.filter((item) => item.status === "ENTERED");
    }
    return fullQueue.filter((item) => item.status === "EXITED" || item.status === "CANCELLED");
  }, [activeTab, fullQueue]);

  const selectedBooth = booths.find((booth) => booth.boothId === selectedBoothId) || null;

  if (isLoading && !dashboardData) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F1F3F5]">
        <Loader2 className="h-12 w-12 animate-spin text-[#2D2A4A]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F1F3F5]">
      <Sidebar userName={userName} role="총괄 팀장" eventId={eventId} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-8">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-xl bg-[#2D2A4A] p-2.5">
                  <Radio className="h-5 w-5 text-[#C4FF00]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">부스 운영 미리보기</h1>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {event?.name || "행사"}의 부스 운영 상태를 총괄 화면에서 바로 확인하고 조작합니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={selectedBoothId ?? ""}
                onChange={(e) => setSelectedBoothId(Number(e.target.value))}
                className="h-12 min-w-72 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm"
              >
                {booths.length === 0 && <option value="">부스가 없습니다</option>}
                {booths.map((booth) => (
                  <option key={booth.boothId} value={booth.boothId}>
                    {booth.boothName} · {booth.locationCode}
                  </option>
                ))}
              </select>

              <button
                onClick={handleRefresh}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <RefreshCcw className={`h-4 w-4 ${isQueueLoading ? "animate-spin" : ""}`} />
                새로고침
              </button>
            </div>
          </div>

          {!selectedBooth ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm font-semibold text-gray-500 shadow-sm">
              운영할 부스가 없습니다.
            </div>
          ) : (
            <>
              <div className="mb-6 grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="text-xs font-black uppercase tracking-widest text-indigo-500">선택 부스</div>
                  <div className="mt-2 text-lg font-black text-gray-900">{selectedBooth.boothName}</div>
                  <div className="mt-1 text-sm font-semibold text-gray-500">{selectedBooth.locationCode}</div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="text-xs font-black uppercase tracking-widest text-amber-500">대기 중</div>
                  <div className="mt-2 text-3xl font-black text-gray-900">{queueCounts.waiting}</div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="text-xs font-black uppercase tracking-widest text-emerald-500">체험 중</div>
                  <div className="mt-2 text-3xl font-black text-gray-900">{queueCounts.entered}</div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="text-xs font-black uppercase tracking-widest text-rose-500">처리 완료</div>
                  <div className="mt-2 text-3xl font-black text-gray-900">{queueCounts.done}</div>
                </div>
              </div>

              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="inline-flex h-14 items-center rounded-[20px] bg-white p-1.5 shadow-sm border border-gray-100">
                  {[
                    { key: "WAITING" as const, label: `대기 ${queueCounts.waiting}` },
                    { key: "ENTERED" as const, label: `입장 ${queueCounts.entered}` },
                    { key: "DONE" as const, label: `완료 ${queueCounts.done}` },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`inline-flex h-full items-center justify-center rounded-[14px] px-6 text-sm font-black transition-all ${
                        activeTab === tab.key
                          ? "bg-[#2D2A4A] text-white shadow-lg shadow-[#2D2A4A]/20"
                          : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCallNext}
                  className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#2D2A4A] px-6 text-sm font-black text-white shadow-lg shadow-[#2D2A4A]/20 hover:bg-[#3A375C]"
                >
                  <Bell className="h-5 w-5" />
                  다음 대기자 호출
                </button>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div>
                    <h2 className="text-lg font-black text-gray-900">운영 큐 상태</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      총괄 계정으로 선택한 부스의 실시간 큐를 조회하고 운영 액션을 실행합니다.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5 text-xs font-black text-gray-600">
                    <Users className="h-4 w-4" />
                    {dashboardData?.summary?.totalActiveCount ?? queueCounts.waiting + queueCounts.entered}명 활성
                  </div>
                </div>

                {filteredQueue.length === 0 ? (
                  <div className="px-6 py-14 text-center text-sm font-semibold text-gray-400">
                    현재 탭에 표시할 대기 데이터가 없습니다.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredQueue.map((item) => (
                      <div
                        key={item.waitingId}
                        className="flex flex-col gap-4 px-6 py-5 xl:flex-row xl:items-center xl:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-black text-gray-700">
                              #{item.waitingNumber}
                            </span>
                            <span className="text-base font-black text-gray-900">{item.visitorName}</span>
                            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                              {item.status}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-500">
                            {item.calledAt ? `호출 시각 ${item.calledAt}` : "아직 호출되지 않음"}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {isWaitingLike(item.status) && (
                            <button
                              onClick={() => handleCancel(item.waitingId)}
                              className="flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700 hover:bg-rose-100"
                            >
                              <XCircle className="h-4 w-4" />
                              취소
                            </button>
                          )}

                          {item.status === "REGISTERED" && (
                            <button
                              onClick={() => handleAdmit(item.waitingId)}
                              className="flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              입장
                            </button>
                          )}

                          {item.status === "ENTERED" && (
                            <button
                              onClick={() => handleExit(item.waitingId)}
                              className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold text-gray-700 hover:bg-gray-100"
                            >
                              <LogOut className="h-4 w-4" />
                              퇴장
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

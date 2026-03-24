"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Play, RefreshCw, BarChart3, Check, AlertCircle } from "lucide-react";
import { reportApi } from "@/lib/api/report";

interface Props {
  eventId: string;
  eventStatus: string;
  onComplete: () => void;
}

const STAGES = [
  { key: "DUMPING", label: "데이터 수집" },
  { key: "ANALYZING", label: "분석 진행" },
  { key: "IMPORTING", label: "결과 저장" },
  { key: "COMPLETED", label: "완료" },
];

export function ReportGenerator({ eventId, eventStatus, onComplete }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check initial status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await reportApi.getReportStatus(eventId);
        const s = res.data?.data?.status;
        if (s && s !== "NOT_STARTED") {
          setStatus(s);
          if (s === "COMPLETED") {
            onComplete();
          } else if (s !== "FAILED") {
            startPolling();
          }
        }
      } catch {
        // no status yet
      }
    };
    checkStatus();
    return () => stopPolling();
  }, [eventId]);

  const startPolling = () => {
    stopPolling();
    intervalRef.current = setInterval(async () => {
      try {
        const res = await reportApi.getReportStatus(eventId);
        const s = res.data?.data?.status;
        if (s) {
          setStatus(s);
          if (s === "COMPLETED") {
            stopPolling();
            onComplete();
          } else if (s === "FAILED") {
            stopPolling();
            setError("리포트 생성에 실패했습니다. 다시 시도해 주세요.");
          }
        }
      } catch {
        // keep polling
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleGenerate = async () => {
    setIsTriggering(true);
    setError(null);
    try {
      await reportApi.generateReport(eventId);
      setStatus("PENDING");
      startPolling();
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "리포트 생성 요청에 실패했습니다.";
      setError(msg);
    } finally {
      setIsTriggering(false);
    }
  };

  const isGenerating =
    status && !["COMPLETED", "FAILED", "NOT_STARTED"].includes(status);

  // Event not closed
  if (eventStatus !== "CLOSED") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
          <BarChart3 className="w-10 h-10 text-gray-300" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-700 mb-2">
            행사 종료 후 이용 가능합니다
          </h3>
          <p className="text-sm text-gray-400">
            행사 상태를 종료(CLOSED)로 변경한 뒤 분석 리포트를 생성할 수
            있습니다.
          </p>
        </div>
      </div>
    );
  }

  // Generating
  if (isGenerating) {
    const currentIdx = STAGES.findIndex((s) => s.key === status);
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-8">
        <Loader2 className="w-12 h-12 animate-spin text-[#2D2A4A]" />
        <div className="text-center mb-2">
          <h3 className="text-xl font-bold text-gray-700 mb-1">
            리포트 생성 중...
          </h3>
          <p className="text-sm text-gray-400">
            잠시만 기다려 주세요. 데이터 양에 따라 수 분이 소요될 수 있습니다.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3">
          {STAGES.map((stage, i) => {
            const isDone = i < currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <div key={stage.key} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      isDone
                        ? "bg-emerald-100 text-emerald-600"
                        : isCurrent
                          ? "bg-[#2D2A4A] text-[#C4FF00]"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-4 h-4" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span className="text-xs font-bold">{i + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-bold ${isCurrent ? "text-[#2D2A4A]" : "text-gray-400"}`}
                  >
                    {stage.label}
                  </span>
                </div>
                {i < STAGES.length - 1 && (
                  <div
                    className={`w-8 h-0.5 rounded-full mb-5 ${isDone ? "bg-emerald-300" : "bg-gray-200"}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Not generated yet (or failed)
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center">
        <BarChart3 className="w-10 h-10 text-indigo-400" />
      </div>
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-700 mb-2">
          분석 리포트를 생성해 보세요
        </h3>
        <p className="text-sm text-gray-400 max-w-md">
          행사 기간 중 수집된 행동 로그와 대기열 데이터를 분석하여
          <br />
          부스 성과, 시간대별 유입량, 동선, 문제 지점을 리포트로 제공합니다.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 rounded-xl text-sm text-rose-600 font-medium">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={isTriggering}
        className="flex items-center gap-2 px-8 py-3.5 bg-[#C4FF00] text-[#2D2A4A] rounded-2xl font-black text-[15px] hover:bg-[#bcfd00] hover:scale-105 transition-all shadow-lg shadow-[#C4FF00]/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
      >
        {isTriggering ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : status === "FAILED" ? (
          <RefreshCw className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5" />
        )}
        {status === "FAILED" ? "다시 생성하기" : "리포트 생성하기"}
      </button>
    </div>
  );
}

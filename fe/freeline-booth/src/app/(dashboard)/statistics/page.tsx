"use client";

import { useState, useEffect } from "react";
import { Loader2, BarChart3 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { reportApi, BoothReportResponseDto } from "@/lib/api/report";
import { BoothSummaryCards } from "@/components/report/BoothSummaryCards";
import { HourlyTrafficChart } from "@/components/report/HourlyTrafficChart";
import { ProblemSpots } from "@/components/report/ProblemSpots";
import { EventSummaryCard } from "@/components/report/EventSummaryCard";

export default function StatisticsPage() {
  const { user } = useAuth();
  const [report, setReport] = useState<BoothReportResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await reportApi.getMyBoothReport();
        if (res.data?.success && res.data?.data) {
          setReport(res.data.data);
        }
      } catch {
        setError("리포트 데이터를 불러올 수 없습니다. 행사 종료 후 관리자가 리포트를 생성하면 확인할 수 있습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#2D2A4A]" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
            <BarChart3 className="w-10 h-10 text-gray-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              리포트가 아직 준비되지 않았습니다
            </h3>
            <p className="text-sm text-gray-400">
              {error || "행사 종료 후 관리자가 리포트를 생성하면 이곳에서 확인할 수 있습니다."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 bg-[#2D2A4A] rounded-xl">
            <BarChart3 className="w-5 h-5 text-[#C4FF00]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">사용자 통계</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {user?.boothName || "부스"} 분석 결과
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-8 pb-12 overflow-y-auto">
        <div className="space-y-6 max-w-[1200px]">
          {/* Booth Performance Summary */}
          <BoothSummaryCards performance={report.boothPerformance} />

          {/* Hourly Traffic Chart */}
          <HourlyTrafficChart data={report.hourlyTraffics} />

          {/* Two-column: Problem Spots + Event Summary */}
          <div className="grid grid-cols-2 gap-6">
            <ProblemSpots data={report.problemSpots} />
            {report.eventSummary && (
              <EventSummaryCard summary={report.eventSummary} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

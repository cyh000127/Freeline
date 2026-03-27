"use client";

import { AlertTriangle } from "lucide-react";
import type { ProblemSpotDto } from "@/lib/api/report";

interface Props {
  data: ProblemSpotDto[];
}

const severityConfig: Record<
  string,
  { border: string; badge: string; badgeBg: string }
> = {
  CRITICAL: {
    border: "border-l-rose-500",
    badge: "text-rose-700",
    badgeBg: "bg-rose-100",
  },
  HIGH: {
    border: "border-l-amber-500",
    badge: "text-amber-700",
    badgeBg: "bg-amber-100",
  },
  MEDIUM: {
    border: "border-l-yellow-400",
    badge: "text-yellow-700",
    badgeBg: "bg-yellow-100",
  },
};

function getSeverityStyle(severity: string) {
  return (
    severityConfig[severity] || {
      border: "border-l-gray-300",
      badge: "text-gray-600",
      badgeBg: "bg-gray-100",
    }
  );
}

export function ProblemSpots({ data }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2 bg-[#2D2A4A] rounded-xl">
          <AlertTriangle className="w-4 h-4 text-[#C4FF00]" />
        </div>
        <h3 className="text-base font-bold text-gray-900">이탈률 높은 부스</h3>
        {data.length > 0 && (
          <span className="ml-2 px-2.5 py-0.5 bg-rose-100 rounded-full text-xs font-bold text-rose-700">
            {data.length}건
          </span>
        )}
      </div>

      {data.length === 0 ? (
        <div className="h-32 flex flex-col items-center justify-center text-gray-400 gap-2">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <span className="text-xl text-emerald-500 font-bold">OK</span>
          </div>
          <span className="text-sm font-bold">이탈률이 높은 부스가 없습니다</span>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((issue, i) => {
            const style = getSeverityStyle(issue.severity);
            return (
              <div
                key={i}
                className={`border-l-4 ${style.border} bg-gray-50 rounded-xl rounded-l-none p-4`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${style.badgeBg} ${style.badge}`}
                  >
                    {issue.severity}
                  </span>
                  <span className="text-[13px] font-bold text-gray-800">
                    {issue.targetName}
                  </span>
                  <span className="ml-auto text-sm font-black text-gray-600 tabular-nums">
                    {(issue.issueMetric * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

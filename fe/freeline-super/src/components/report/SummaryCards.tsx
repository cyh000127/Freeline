"use client";

import { Users, ClipboardList, Clock, TrendingDown, Zap } from "lucide-react";
import type { EventSummaryDto } from "@/lib/api/report";

interface Props {
  summary: EventSummaryDto;
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}초`;
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return sec > 0 ? `${min}분 ${sec}초` : `${min}분`;
}

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function formatPeakHour(peakHour: string | null): string {
  if (!peakHour) return "-";
  // "2026-03-20T14" → "14시"
  const match = peakHour.match(/T?(\d{1,2})$/);
  if (match) return `${parseInt(match[1])}시`;
  return peakHour;
}

const cards = [
  {
    key: "visitors",
    label: "총 방문자",
    icon: Users,
    bg: "bg-indigo-50",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    getValue: (s: EventSummaryDto) => s.totalVisitors.toLocaleString(),
    suffix: "명",
  },
  {
    key: "registrations",
    label: "총 대기 등록",
    icon: ClipboardList,
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    getValue: (s: EventSummaryDto) => s.totalRegistrations.toLocaleString(),
    suffix: "건",
  },
  {
    key: "avgWait",
    label: "평균 대기 시간",
    icon: Clock,
    bg: "bg-amber-50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    getValue: (s: EventSummaryDto) => formatSeconds(s.avgWaitingSeconds),
    suffix: "",
  },
  {
    key: "dropout",
    label: "전체 이탈률",
    icon: TrendingDown,
    bg: "bg-rose-50",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    getValue: (s: EventSummaryDto) => formatPercent(s.overallDropoutRate),
    suffix: "",
  },
];

export function SummaryCards({ summary }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.key}
            className={`${card.bg} rounded-2xl p-5 flex flex-col gap-3`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${card.iconBg}`}>
                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
              <span className="text-[13px] font-bold text-gray-500">
                {card.label}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-gray-900">
                {card.getValue(summary)}
              </span>
              {card.suffix && (
                <span className="text-sm font-bold text-gray-400">
                  {card.suffix}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Peak hour badge */}
      {summary.peakHour && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#2D2A4A] rounded-xl w-fit">
          <Zap className="w-4 h-4 text-[#C4FF00]" />
          <span className="text-[13px] font-bold text-white">
            피크 시간대
          </span>
          <span className="text-[13px] font-black text-[#C4FF00]">
            {formatPeakHour(summary.peakHour)}
          </span>
        </div>
      )}
    </div>
  );
}

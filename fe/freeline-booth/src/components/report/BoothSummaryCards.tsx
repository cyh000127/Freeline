"use client";

import { Eye, ClipboardList, TrendingUp, TrendingDown } from "lucide-react";
import type { BoothPerformanceDto } from "@/lib/api/report";

interface Props {
  performance: BoothPerformanceDto;
}

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

const cards = [
  {
    key: "views",
    label: "조회수",
    icon: Eye,
    bg: "bg-indigo-50",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    getValue: (p: BoothPerformanceDto) => p.viewCount.toLocaleString(),
    suffix: "회",
  },
  {
    key: "registrations",
    label: "대기 등록수",
    icon: ClipboardList,
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    getValue: (p: BoothPerformanceDto) => p.registerCount.toLocaleString(),
    suffix: "건",
  },
  {
    key: "conversion",
    label: "전환율",
    icon: TrendingUp,
    bg: "bg-amber-50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    getValue: (p: BoothPerformanceDto) => formatPercent(p.conversionRate),
    suffix: "",
  },
  {
    key: "dropout",
    label: "이탈률",
    icon: TrendingDown,
    bg: "bg-rose-50",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    getValue: (p: BoothPerformanceDto) => formatPercent(p.dropoutRate),
    suffix: "",
  },
];

export function BoothSummaryCards({ performance }: Props) {
  return (
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
              {card.getValue(performance)}
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
  );
}

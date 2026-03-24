"use client";

import { useState } from "react";
import { Store, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { BoothPerformanceDto } from "@/lib/api/report";

interface Props {
  data: BoothPerformanceDto[];
}

type SortKey = keyof BoothPerformanceDto;
type SortDir = "asc" | "desc";

const columns: { key: SortKey; label: string; align: string }[] = [
  { key: "boothName", label: "부스명", align: "text-left" },
  { key: "viewCount", label: "조회수", align: "text-right" },
  { key: "registerCount", label: "등록수", align: "text-right" },
  { key: "dropoutCount", label: "이탈수", align: "text-right" },
  { key: "conversionRate", label: "전환율", align: "text-right" },
  { key: "dropoutRate", label: "이탈률", align: "text-right" },
];

function RateBar({ value, color }: { value: number; color: string }) {
  const pct = Math.min(value * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-gray-600 tabular-nums w-12 text-right">
        {(value * 100).toFixed(1)}%
      </span>
    </div>
  );
}

export function BoothPerformanceTable({ data }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("viewCount");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return sortDir === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col)
      return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-[#2D2A4A]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#2D2A4A]" />
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
        <div className="p-2 bg-[#2D2A4A] rounded-xl">
          <Store className="w-4 h-4 text-[#C4FF00]" />
        </div>
        <h3 className="text-base font-bold text-gray-900">부스별 성과</h3>
        <span className="ml-2 px-2.5 py-0.5 bg-[#F4F5F7] rounded-full text-xs font-bold text-gray-600">
          {data.length}개
        </span>
      </div>

      {data.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
          데이터가 없습니다
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8F9FA] text-gray-500 text-xs font-bold uppercase tracking-wider">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 ${col.align} cursor-pointer hover:bg-gray-100 transition-colors select-none`}
                    onClick={() => handleSort(col.key)}
                  >
                    <div
                      className={`flex items-center gap-1 ${col.align === "text-right" ? "justify-end" : ""}`}
                    >
                      {col.label}
                      <SortIcon col={col.key} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((row) => (
                <tr
                  key={row.boothId}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {row.boothName}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                    {row.viewCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                    {row.registerCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                    {row.dropoutCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 w-40">
                    <RateBar value={row.conversionRate} color="bg-indigo-500" />
                  </td>
                  <td className="px-4 py-3 w-40">
                    <RateBar
                      value={row.dropoutRate}
                      color={
                        row.dropoutRate >= 0.3
                          ? "bg-rose-500"
                          : row.dropoutRate >= 0.15
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

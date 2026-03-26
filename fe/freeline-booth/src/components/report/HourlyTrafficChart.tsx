"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
import type { HourlyTrafficDto } from "@/lib/api/report";

interface Props {
  data: HourlyTrafficDto[];
}

function formatHour(datetimeHour: string): string {
  const match = datetimeHour.match(/T?(\d{1,2})$/);
  if (match) return `${parseInt(match[1])}시`;
  return datetimeHour;
}

export function HourlyTrafficChart({ data }: Props) {
  const chartData = data.map((d) => ({
    hour: formatHour(d.datetimeHour),
    activeUsers: d.activeUserCount,
    registrations: d.registerCount,
  }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="p-2 bg-[#2D2A4A] rounded-xl">
          <BarChart3 className="w-4 h-4 text-[#C4FF00]" />
        </div>
        <h3 className="text-base font-bold text-gray-900">시간대별 유입량</h3>
      </div>

      {chartData.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
          데이터가 없습니다
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 12, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontSize: "13px",
              }}
              labelStyle={{ fontWeight: 700, color: "#2D2A4A" }}
            />
            <Legend
              wrapperStyle={{ fontSize: "13px", fontWeight: 600 }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="activeUsers"
              name="활성 사용자"
              fill="#6366F1"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="registrations"
              name="대기 등록"
              fill="#C4FF00"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

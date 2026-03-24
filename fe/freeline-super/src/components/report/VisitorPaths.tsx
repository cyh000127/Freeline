"use client";

import { Route, Trophy } from "lucide-react";
import type { VisitorPathDto } from "@/lib/api/report";

interface Props {
  data: VisitorPathDto[];
}

function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return (
    <span className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
      {rank}
    </span>
  );
}

export function VisitorPaths({ data }: Props) {
  const maxCount = data.length > 0 ? data[0].visitorCount : 1;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2 bg-[#2D2A4A] rounded-xl">
          <Route className="w-4 h-4 text-[#C4FF00]" />
        </div>
        <h3 className="text-base font-bold text-gray-900">
          방문자 동선 Top {Math.min(data.length, 10)}
        </h3>
      </div>

      {data.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
          데이터가 없습니다
        </div>
      ) : (
        <div className="space-y-3">
          {data.slice(0, 10).map((path, i) => {
            const ratio = (path.visitorCount / maxCount) * 100;
            const segments = path.pathString.split(/\s*[-→>]+\s*/);

            return (
              <div key={i} className="flex items-center gap-3">
                <MedalIcon rank={i + 1} />

                <div className="flex-1 min-w-0">
                  {/* Path segments */}
                  <div className="flex items-center gap-1 flex-wrap mb-1.5">
                    {segments.map((seg, j) => (
                      <span key={j} className="flex items-center gap-1">
                        <span className="px-2 py-0.5 bg-[#F4F5F7] rounded-lg text-xs font-bold text-gray-700 whitespace-nowrap">
                          {seg.trim()}
                        </span>
                        {j < segments.length - 1 && (
                          <span className="text-gray-300 text-xs">→</span>
                        )}
                      </span>
                    ))}
                  </div>

                  {/* Bar */}
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full transition-all"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>

                <span className="text-sm font-black text-gray-700 tabular-nums whitespace-nowrap">
                  {path.visitorCount.toLocaleString()}명
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

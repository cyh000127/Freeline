"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AddEventModal } from "@/components/AddEventModal";
import { EditEventModal } from "@/components/EditEventModal";
import { MoreVertical } from "lucide-react";
import { api } from "@/lib/api";

export default function SuperAdminDashboard() {
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const handleEditClick = (eventData: any) => {
    setSelectedEvent(eventData);
    setIsEditEventOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (id: number) => {
    if (confirm("정말로 이 행사를 삭제하시겠습니까? (삭제 시 복구할 수 없습니다)")) {
      try {
        await api.delete(`/api/v1/events/${id}`);
        alert("행사 삭제 호출이(api) 전달되었습니다.");
      } catch (err) {
        console.error("삭제 실패", err);
        alert("삭제에 실패했습니다.");
      }
    }
    setOpenMenuId(null);
  };

  // Dummy event data based on UI elements
  const dummyEvent1 = { id: 1, name: "AW 2026", startDate: "2026-03-06", endDate: "2026-03-08", openTime: "10:00:00", closeTime: "18:00:00", status: "CLOSED", locationAddress: "" };
  const dummyEvent2 = { id: 2, name: "AW 2026", startDate: "2026-03-16", endDate: "2026-03-18", openTime: "10:00:00", closeTime: "18:00:00", status: "OPEN", locationAddress: "" };

  return (
    <div className="min-h-screen bg-[#F1F3F5] flex flex-col">
      {/* Top Navbar */}
      <header className="h-24 bg-[#2D2A4A] flex items-center justify-between px-8 text-white shrink-0">
        <div className="w-[100px]" /> {/* Spacer for centering */}
        
        <div className="flex flex-col items-center justify-center mt-2">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <img src="/assets/logo.png" alt="줄서잇 매니저 로고" className="h-6 w-auto object-contain" />
            줄서잇 매니저
          </div>
          <p className="mt-2 text-sm text-gray-300 font-medium">
            부스 운영을 스마트하고 간편하게
          </p>
        </div>

        <div className="w-[100px] flex justify-end">
          <button className="text-sm font-bold hover:text-gray-300 transition-colors">
            로그아웃
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10 flex flex-col gap-6 relative">
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-2">
          <Button 
            variant="outline" 
            className="h-12 px-6 rounded-xl border-2 border-[#2D2A4A] text-[#2D2A4A] font-bold shadow-sm hover:bg-[#2D2A4A] hover:text-white transition-colors"
            onClick={() => setIsAddEventOpen(true)}
          >
            + 행사 추가하기
          </Button>
          <div className="text-lg font-bold text-[#111111]">
            홍길동님, 환영합니다.
          </div>
        </div>

        {/* Event Cards List */}
        <div className="flex flex-col gap-6">
          
          {/* Card: Ended Event (Grey) */}
          <div className="relative w-full h-32 bg-gradient-to-r from-gray-300 via-white to-white rounded-xl shadow-md flex items-center border border-gray-100 transition-transform hover:scale-[1.01] cursor-pointer">
            <div className="flex-1 px-14 flex items-center justify-between z-10">
              <h3 className="text-3xl font-bold text-gray-900 tracking-tight">AW 2026</h3>
              <div className="flex flex-col text-center">
                <span className="text-2xl font-bold text-gray-900 leading-tight">2026.03.06~</span>
                <span className="text-2xl font-bold text-gray-900 leading-tight">2026.03.08</span>
              </div>
              <div className="flex items-center gap-12">
                <div className="w-32 text-right text-2xl font-bold text-gray-400 whitespace-nowrap">
                  종료
                </div>
                
                {/* 3-Dots Menu */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === 1 ? null : 1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <MoreVertical className="w-6 h-6 text-gray-400" />
                  </button>
                  {openMenuId === 1 && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 shadow-xl rounded-xl z-50 py-1">
                      <button 
                        onClick={() => handleEditClick(dummyEvent1)}
                        className="w-full text-left px-5 py-3 hover:bg-gray-50 text-[15px] font-bold text-gray-700 transition-colors"
                      >
                        정보 및 상태 수정
                      </button>
                      <button 
                        onClick={() => handleDelete(1)}
                        className="w-full text-left px-5 py-3 hover:bg-red-50 text-red-600 text-[15px] font-bold transition-colors border-t border-gray-50"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card: Active Event (Green) */}
          <div className="relative w-full h-32 bg-gradient-to-r from-emerald-200 via-white to-white rounded-xl shadow-md flex items-center border border-gray-100 transition-transform hover:scale-[1.01] cursor-pointer">
            <div className="flex-1 px-14 flex items-center justify-between z-10">
              <h3 className="text-3xl font-bold text-gray-900 tracking-tight">AW 2026</h3>
              <div className="flex flex-col text-center">
                <span className="text-2xl font-bold text-gray-900 leading-tight">2026.03.16~</span>
                <span className="text-2xl font-bold text-gray-900 leading-tight">2026.03.18</span>
              </div>
              <div className="flex items-center gap-12">
                <div className="w-32 text-right text-2xl font-bold text-[#10B981] whitespace-nowrap">
                  진행 중
                </div>

                {/* 3-Dots Menu */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === 2 ? null : 2)}
                    className="p-2 hover:bg-emerald-50 rounded-full transition-colors"
                  >
                    <MoreVertical className="w-6 h-6 text-[#10B981]" />
                  </button>
                  {openMenuId === 2 && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 shadow-xl rounded-xl z-50 py-1">
                      <button 
                        onClick={() => handleEditClick(dummyEvent2)}
                        className="w-full text-left px-5 py-3 hover:bg-gray-50 text-[15px] font-bold text-gray-700 transition-colors"
                      >
                        정보 및 상태 수정
                      </button>
                      <button 
                        onClick={() => handleDelete(2)}
                        className="w-full text-left px-5 py-3 hover:bg-red-50 text-red-600 text-[15px] font-bold transition-colors border-t border-gray-50"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        <AddEventModal 
          isOpen={isAddEventOpen} 
          onClose={() => setIsAddEventOpen(false)} 
        />
        <EditEventModal
          isOpen={isEditEventOpen}
          onClose={() => setIsEditEventOpen(false)}
          event={selectedEvent}
        />
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AddEventModal } from "@/components/AddEventModal";
import { EditEventModal } from "@/components/EditEventModal";
import { MoreVertical, Settings, LogOut, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { authApi } from "@/lib/api/auth";
import { eventApi, Event } from "@/lib/api/event";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [userName, setUserName] = useState("관리자");
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const fetchEvents = async () => {
    try {
      setIsLoadingEvents(true);
      const res = await eventApi.getEvents();
      
      // 1. 데이터가 'data' 필드 안에 있는 경우 (래퍼가 있는 경우)
      if (res.data?.success && res.data?.data && Array.isArray(res.data.data.content)) {
        setEvents(res.data.data.content);
      } 
      // 2. 데이터(PaginatedResponse)가 최상위에 바로 있는 경우 (래퍼가 없는 경우)
      else if (res.data && Array.isArray((res.data as any).content)) {
        setEvents((res.data as any).content);
      }
      else {
        setEvents([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch events", err);
      if (err.response) {
        console.error("Error Response Data:", err.response.data);
        console.error("Error Response Status:", err.response.status);
      }
      // 404 등 에러 발생 시 빈 목록으로 처리
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    // Check for auth token, redirect to login if missing
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    // Fetch user info
    const fetchUser = async () => {
      try {
        const res = await authApi.getMe();
        if (res.data?.success && res.data?.data?.name) {
          setUserName(res.data.data.name);
        }
      } catch (err) {
        console.error("Failed to fetch user info", err);
      } finally {
        setIsChecking(false);
      }
    };

    fetchUser();
    fetchEvents();
  }, [router]);

  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const handleEditClick = (eventData: Event) => {
    const id = eventData.eventId || (eventData as any).id;
    if (id) {
      router.push(`/events/${id}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("정말로 이 행사를 삭제하시겠습니까? (삭제 시 복구할 수 없습니다)")) {
      try {
        await eventApi.deleteEvent(id);
        alert("행사가 성공적으로 삭제되었습니다.");
        fetchEvents(); // 목록 새로고침
      } catch (err) {
        console.error("삭제 실패", err);
        alert("삭제에 실패했습니다.");
      }
    }
    setOpenMenuId(null);
  };

  const handleLogout = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      localStorage.removeItem("accessToken");
      router.replace("/login");
    }
  };
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId !== null) {
      window.addEventListener("click", handleClickOutside);
    }
    return () => window.removeEventListener("click", handleClickOutside);
  }, [openMenuId]);

  if (isChecking) {
    return <div className="min-h-screen bg-[#F1F3F5]" />;
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "OPEN":
        return { text: "진행 중", color: "text-[#10B981]", bgColor: "from-emerald-200" };
      case "CLOSED":
      case "ENDED":
        return { text: "종료", color: "text-gray-400", bgColor: "from-gray-300" };
      case "PREPARING":
      case "UPCOMING":
      case "DRAFT":
        return { text: "준비 중", color: "text-blue-400", bgColor: "from-blue-200" };
      default:
        return { text: status, color: "text-gray-400", bgColor: "from-gray-300" };
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F3F5] flex flex-col">
      {/* Top Navbar */}
      <header className="h-24 bg-[#2D2A4A] flex items-center justify-between px-8 text-white shrink-0">
        <div className="w-[100px]" /> {/* Spacer for centering */}
        
        <div className="flex flex-col items-center justify-center mt-2">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Image src="/super/assets/logo.png" alt="줄서잇 매니저 로고" width={100} height={24} className="h-6 w-auto object-contain" priority />
            줄서잇 매니저
          </div>
          <p className="mt-2 text-sm text-gray-300 font-medium">
            부스 운영을 스마트하고 간편하게
          </p>
        </div>

        <div className="w-[100px] flex justify-end items-center gap-2 text-gray-300">
          <Link href="/settings" title="설정" className="hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
            <Settings className="w-5 h-5" />
          </Link>
          <button 
            title="로그아웃" 
            onClick={handleLogout}
            className="hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 pt-10 pb-24 flex flex-col gap-6 relative">
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
            {userName}님, 환영합니다.
          </div>
        </div>

        {/* Event Cards List */}
        <div className="flex flex-col gap-6">
          {isLoadingEvents ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-[#2D2A4A]" />
              <p className="text-gray-500 font-medium">행사 목록을 불러오는 중입니다...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl shadow-sm border border-gray-100">
              <p className="text-gray-400 text-lg font-medium">등록된 행사가 없습니다.</p>
              <p className="text-gray-400 text-sm mt-1">상단의 '행사 추가하기' 버튼을 눌러 새 행사를 등록해보세요!</p>
            </div>
          ) : (
            events.map((event) => {
              const statusDisplay = getStatusDisplay(event.status);
              return (
                <div 
                  key={event.eventId}
                  onClick={() => handleEditClick(event)}
                  className={`relative w-full h-32 bg-gradient-to-r ${statusDisplay.bgColor} via-white to-white rounded-xl shadow-md flex items-center border border-gray-100 transition-transform hover:scale-[1.01] cursor-pointer ${openMenuId === event.eventId ? 'z-40' : 'z-0'}`}
                >
                  <div className="flex-1 px-14 flex items-center justify-between z-10">
                    <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{event.name}</h3>
                    <div className="flex flex-col text-center">
                      <span className="text-2xl font-bold text-gray-900 leading-tight">{event.startDate.replace(/-/g, '.')}~</span>
                      <span className="text-2xl font-bold text-gray-900 leading-tight">{event.endDate.replace(/-/g, '.')}</span>
                    </div>
                    <div className="flex items-center gap-12">
                      <div className={`w-32 text-right text-2xl font-bold ${statusDisplay.color} whitespace-nowrap`}>
                        {statusDisplay.text}
                      </div>
                      
                      {/* 3-Dots Menu */}
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => setOpenMenuId(openMenuId === event.eventId ? null : event.eventId)}
                          className="p-2 hover:bg-black/5 rounded-full transition-colors"
                        >
                          <MoreVertical className={`w-6 h-6 ${statusDisplay.color}`} />
                        </button>
                        {openMenuId === event.eventId && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 shadow-xl rounded-xl z-50 py-1">
                            <button 
                              onClick={() => handleEditClick(event)}
                              className="w-full text-left px-5 py-3 hover:bg-gray-50 text-[15px] font-bold text-gray-700 transition-colors"
                            >
                              정보 및 상태 수정
                            </button>
                            <button 
                              onClick={() => handleDelete(event.eventId)}
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
              );
            })
          )}
        </div>

        <AddEventModal 
          isOpen={isAddEventOpen} 
          onClose={() => {
            setIsAddEventOpen(false);
            fetchEvents();
          }} 
        />
        <EditEventModal
          isOpen={isEditEventOpen}
          onClose={() => {
            setIsEditEventOpen(false);
            fetchEvents();
          }}
          event={selectedEvent}
        />
      </main>
    </div>
  );
}

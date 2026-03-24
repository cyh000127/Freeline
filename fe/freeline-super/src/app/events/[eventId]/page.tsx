"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { EditEventModal } from "@/components/EditEventModal";
import { eventApi, Event } from "@/lib/api/event";
import { authApi } from "@/lib/api/auth";
import { 
  Edit3, 
  Map as MapIcon, 
  Upload, 
  Calendar, 
  MapPin, 
  Loader2 
} from "lucide-react";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [userName, setUserName] = useState("관리자");
  const [isLoading, setIsLoading] = useState(true);
  const [layoutImageUrl, setLayoutImageUrl] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch User Info
        const userRes = await authApi.getMe();
        if (userRes.data?.success && userRes.data?.data?.name) {
          setUserName(userRes.data.data.name);
        }

        // Fetch Event Detail
        const eventRes = await eventApi.getEvent(eventId);
        let detail = null;
        if (eventRes.data?.success && eventRes.data?.data) {
          detail = eventRes.data.data;
        } else if (eventRes.data && (eventRes.data as any).eventId) {
          detail = eventRes.data;
        }

        if (detail) {
          setEvent(detail as Event);
        }
      } catch (error) {
        console.error("Failed to fetch event detail:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  const handleLayoutUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setLayoutImageUrl(reader.result as string);
      // TODO: Implement actual API call to save layout image
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F1F3F5]">
        <Loader2 className="w-12 h-12 animate-spin text-[#2D2A4A]" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F1F3F5]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">행사를 찾을 수 없습니다.</h2>
          <button onClick={() => router.push("/")} className="mt-4 text-[#2D2A4A] font-bold hover:underline">
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#F1F3F5] h-screen overflow-hidden">
      <Sidebar userName={userName} role="총괄 팀장" eventId={eventId} />

      <main className="flex-1 flex flex-col p-8 overflow-y-auto">
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center mb-8 text-center pt-4">
          <h1 className="text-[56px] font-black text-[#2D2A4A] leading-tight tracking-tight uppercase">
            {event.name}
          </h1>
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2.5 text-[22px] font-bold text-gray-400">
              <Calendar className="w-6 h-6" />
              <span>{event.startDate.replace(/-/g, '.')} ~ {event.endDate.replace(/-/g, '.')}</span>
            </div>
            <div className="flex items-center gap-2.5 text-[24px] font-bold text-gray-500 mt-0.5">
              <MapPin className="w-6 h-6" />
              <span>{event.locationAddress || "장소 정보 없음"}</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full max-w-7xl mx-auto bg-white rounded-[40px] shadow-sm border border-gray-100 p-10 flex flex-col relative overflow-hidden min-h-[550px]">

          {/* Status Indicators with Edit Button */}
          <div className="flex items-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#10B981]" />
              <span className="text-[13px] font-bold text-gray-600">원활 (1m²당 5명 이하)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#F59E0B]" />
              <span className="text-[13px] font-bold text-gray-600">보통 (1m²당 7명 이하)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#EF4444]" />
              <span className="text-[13px] font-bold text-gray-600">혼잡 (1m²당 8명 이상)</span>
            </div>
            <div className="ml-auto">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#DBFC53] text-[#2D2A4A] rounded-xl font-black text-[15px] hover:scale-105 transition-all shadow-md shadow-[#DBFC53]/30 active:scale-95"
              >
                <Edit3 className="w-5 h-5" />
                편집하기
              </button>
            </div>
          </div>

          {/* Map Layout Area */}
          <div className="flex-1 bg-[#F1F3F5] rounded-[32px] flex items-center justify-center border-2 border-dashed border-gray-200 overflow-hidden group">
            {layoutImageUrl ? (
              <img src={layoutImageUrl} alt="Booth Layout" className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg">
                  <MapIcon className="w-10 h-10 text-gray-300" />
                </div>
                <div className="text-center">
                  <p className="text-gray-500 font-bold text-[18px]">등록된 박람회 배치도가 없습니다.</p>
                  <p className="text-gray-400 text-[14px] mt-2">배치도 사진을 업로드하여 관람객에게 정보를 제공하세요.</p>
                </div>
              </div>
            )}
            
            {/* Overlay Upload Button */}
            <div className={`absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
              <input
                type="file"
                id="layout-upload"
                accept="image/*"
                className="hidden"
                onChange={handleLayoutUpload}
              />
              <label 
                htmlFor="layout-upload"
                className="bg-white/90 backdrop-blur-sm text-[#2D2A4A] px-8 py-4 rounded-2xl font-black text-[18px] shadow-2xl flex items-center gap-3 cursor-pointer hover:bg-white transition-all transform hover:scale-105"
              >
                <Upload className="w-6 h-6" />
                박람회 배치도 사진 업로드
              </label>
            </div>
          </div>
        </div>
      </main>

      <EditEventModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          // Refresh data after edit
          window.location.reload(); 
        }}
        event={event}
      />
    </div>
  );
}

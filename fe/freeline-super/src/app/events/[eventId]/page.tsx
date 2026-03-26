"use client";

import React, {useState, useEffect, useRef} from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { EditEventModal } from "@/components/EditEventModal";
import {BoothMapEditor} from "@/components/map/BoothMapEditor";
import {BoothSearchModal} from "@/components/map/BoothSearchModal";
import { eventApi, Event } from "@/lib/api/event";
import { authApi } from "@/lib/api/auth";
import {boothMapApi} from "@/lib/api/boothMap";
import { 
  Edit3, 
  Map as MapIcon, 
  Upload,
    Calendar,
    MapPin,
    Loader2,
    Save,
    X
} from "lucide-react";

interface AreaItem {
    boothId: number | null;
    boothName?: string;
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
    localId: string;
}

export default function EventDetailPage() {
  const params = useParams();
    const eventId = Number(params.eventId as string);
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [userName, setUserName] = useState("관리자");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Map state
    const [layoutImageUrl, setLayoutImageUrl] = useState<string | null>(null);
    const [eventMapId, setEventMapId] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [areas, setAreas] = useState<AreaItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Container dimensions
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({width: 0, height: 0});

    // Search Modal state
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [activeLocalId, setActiveLocalId] = useState<string | null>(null);

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
          const eventRes = await eventApi.getEvent(eventId.toString());
        let detail = null;
        if (eventRes.data?.success && eventRes.data?.data) {
          detail = eventRes.data.data;
        } else if (eventRes.data && (eventRes.data as { eventId?: number }).eventId) {
          detail = eventRes.data;
        }

        if (detail) {
          setEvent(detail as Event);
        }

          // Fetch Map Data
          try {
              const mapRes = await boothMapApi.getBoothMap(eventId);
              if (mapRes.data?.success && mapRes.data?.data) {
                  setLayoutImageUrl(mapRes.data.data.mapImageUrl);
                  setEventMapId(mapRes.data.data.eventMapId);

                  if (mapRes.data.data.booths) {
                      const mappedAreas = mapRes.data.data.booths.map((b: {
                          areaId?: number;
                          boothId: number;
                          boothName: string;
                          xRatio: number;
                          yRatio: number;
                          widthRatio: number;
                          heightRatio: number
                      }) => ({
                          localId: `db-${b.areaId || b.boothId}`,
                          boothId: b.boothId,
                          boothName: b.boothName,
                          xRatio: b.xRatio,
                          yRatio: b.yRatio,
                          widthRatio: b.widthRatio,
                          heightRatio: b.heightRatio,
                      }));
                      setAreas(mappedAreas);
                  }
              }
          } catch (mapErr) {
              console.log("No map data found for this event", mapErr);
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

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };

        // Delay initial measure slightly to ensure DOM is fully painted
        setTimeout(updateSize, 100);
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, [layoutImageUrl]);

    const handleLayoutUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            setIsLoading(true);
            const res = await boothMapApi.uploadMapImage(eventId, file, true);

            if (res.data?.success && res.data?.data) {
                setLayoutImageUrl(res.data.data.imagePath);
                setEventMapId(res.data.data.eventMapId);

                // AI Drafts processing
                if (res.data.data.drafts && res.data.data.drafts.length > 0) {
                    const newDrafts = res.data.data.drafts.map((d: {
                        xRatio: number;
                        yRatio: number;
                        widthRatio: number;
                        heightRatio: number
                    }, idx: number) => ({
                        localId: `ai-draft-${idx}-${Date.now()}`,
                        boothId: null,
                        xRatio: d.xRatio,
                        yRatio: d.yRatio,
                        widthRatio: d.widthRatio,
                        heightRatio: d.heightRatio,
                    }));
                    setAreas(newDrafts);
                    setIsEditMode(true); // Automatically enter edit mode
                } else {
                    setAreas([]);
                }
            }
        } catch (err) {
            console.error("Map upload failed", err);
            alert("지도 업로드에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveMap = async () => {
        if (!eventMapId) return;

        // Filter out unmapped areas
        const validAreas = areas.filter(a => a.boothId !== null).map(a => ({
            boothId: a.boothId as number,
            xRatio: a.xRatio,
            yRatio: a.yRatio,
            widthRatio: a.widthRatio,
            heightRatio: a.heightRatio
        }));

        if (validAreas.length === 0 && areas.length > 0) {
            if (!confirm("매핑된 부스가 없습니다. 임시 영역을 모두 삭제하고 저장하시겠습니까?")) {
                return;
            }
        }

        try {
            setIsSaving(true);
            await boothMapApi.updateBoothMapAreas(eventId, eventMapId, validAreas);
            setIsEditMode(false);
            // Optional: Refetch map to ensure sync
        } catch (err) {
            console.error("Failed to save map areas", err);
            alert("지도 저장에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleTempSave = async () => {
        if (!eventMapId) return;
        try {
            setIsSaving(true);
            await boothMapApi.updateBoothMapSnapshot(eventId, eventMapId, {areas});
            alert("임시저장되었습니다.");
        } catch (err) {
            console.error("Failed to save snapshot", err);
            alert("임시저장에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddArea = () => {
        const newArea = {
            localId: `new-${Date.now()}`,
            boothId: null,
            xRatio: 0.45,
            yRatio: 0.45,
            widthRatio: 0.1,
            heightRatio: 0.1,
        };
        setAreas(prev => [...prev, newArea]);
    };

    const handleOpenSearchModal = (localId: string) => {
        setActiveLocalId(localId);
        setIsSearchModalOpen(true);
    };

    const handleSelectBooth = (booth: { boothId: number; boothName: string }) => {
        if (!activeLocalId) return;

        setAreas(prev => prev.map(area => {
            if (area.localId === activeLocalId) {
                return {...area, boothId: booth.boothId, boothName: booth.boothName};
            }
            return area;
        }));

        setIsSearchModalOpen(false);
        setActiveLocalId(null);
  };

    if (isLoading && !layoutImageUrl) {
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

    const mappedBoothIds = areas.filter(a => a.boothId !== null).map(a => a.boothId as number);

  return (
    <div className="flex bg-[#F1F3F5] h-screen overflow-hidden">
        <Sidebar userName={userName} role="총괄 팀장" eventId={eventId.toString()}/>

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
          <div
              className="w-full max-w-7xl mx-auto bg-white rounded-[40px] shadow-sm border border-gray-100 p-10 flex flex-col relative overflow-hidden min-h-[650px]">

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
              <div className="ml-auto flex gap-3">
                  {layoutImageUrl && (
                      isEditMode ? (
                          <>
                              <button
                                  onClick={handleTempSave}
                                  disabled={isSaving}
                                  className="flex items-center gap-2 px-5 py-2.5 bg-green-100 text-green-700 rounded-xl font-black text-[15px] hover:bg-green-200 transition-all shadow-sm disabled:opacity-50"
                              >
                                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>}
                                  임시저장
                              </button>
                              <button
                                  onClick={handleAddArea}
                                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-100 text-blue-700 rounded-xl font-black text-[15px] hover:bg-blue-200 transition-all shadow-sm"
                              >
                                  <MapPin className="w-5 h-5"/>
                                  영역 추가
                              </button>
                              <button
                                  onClick={() => setIsEditMode(false)}
                                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-black text-[15px] hover:bg-gray-300 transition-all"
                              >
                                  <X className="w-5 h-5"/>
                                  취소
                              </button>
                              <button
                                  onClick={handleSaveMap}
                                  disabled={isSaving}
                                  className="flex items-center gap-2 px-5 py-2.5 bg-[#2D2A4A] text-white rounded-xl font-black text-[15px] hover:scale-105 transition-all shadow-md active:scale-95 disabled:opacity-50"
                              >
                                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>}
                                  저장하기
                              </button>
                          </>
                      ) : (
                          <button
                              onClick={() => setIsEditMode(true)}
                              className="flex items-center gap-2 px-5 py-2.5 bg-[#DBFC53] text-[#2D2A4A] rounded-xl font-black text-[15px] hover:scale-105 transition-all shadow-md shadow-[#DBFC53]/30 active:scale-95"
                          >
                              <Edit3 className="w-5 h-5"/>
                              지도 편집
                          </button>
                      )
                  )}
            </div>
          </div>

          {/* Map Layout Area */}
              <div
                  ref={containerRef}
                  className="flex-1 bg-[#F1F3F5] rounded-[32px] flex items-center justify-center border-2 border-dashed border-gray-200 overflow-hidden relative"
              >
            {layoutImageUrl ? (
                <BoothMapEditor
                    layoutImageUrl={layoutImageUrl}
                    initialAreas={areas}
                    isEditMode={isEditMode}
                    containerWidth={containerSize.width}
                    containerHeight={containerSize.height}
                    onOpenSearchModal={handleOpenSearchModal}
                    onAreasChange={setAreas}
                />
            ) : (
                <div className="flex flex-col items-center gap-6 group w-full h-full justify-center">
                    <div
                        className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <MapIcon className="w-10 h-10 text-gray-300" />
                </div>
                <div className="text-center">
                  <p className="text-gray-500 font-bold text-[18px]">등록된 박람회 배치도가 없습니다.</p>
                    <p className="text-gray-400 text-[14px] mt-2">배치도 사진을 업로드하면 AI가 부스 위치를 분석합니다.</p>
                </div>
                    <div className="mt-4">
                        <input
                            type="file"
                            id="layout-upload-empty"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLayoutUpload}
                        />
                        <label
                            htmlFor="layout-upload-empty"
                            className="bg-[#2D2A4A] text-white px-8 py-4 rounded-2xl font-black text-[18px] shadow-lg flex items-center gap-3 cursor-pointer hover:bg-[#1a1836] transition-colors"
                        >
                            <Upload className="w-6 h-6"/>
                            지도 업로드 및 자동 분석
                        </label>
                </div>
              </div>
            )}

                  {/* Overlay Upload Button (when image exists and not editing) */}
                  {layoutImageUrl && !isEditMode && (
                      <div
                          className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10">
                          <input
                              type="file"
                              id="layout-upload-overlay"
                              accept="image/*"
                              className="hidden"
                              onChange={handleLayoutUpload}
                          />
                          <label
                              htmlFor="layout-upload-overlay"
                              className="bg-white/95 backdrop-blur-sm text-[#2D2A4A] px-8 py-4 rounded-2xl font-black text-[18px] shadow-2xl flex items-center gap-3 cursor-pointer hover:bg-white transition-all transform hover:scale-105"
                          >
                              <Upload className="w-6 h-6"/>
                              새 지도 업로드 및 자동 분석
                          </label>
                      </div>
                  )}
          </div>
        </div>
      </main>

      <EditEventModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          window.location.reload(); 
        }}
        event={event}
      />

        <BoothSearchModal
            isOpen={isSearchModalOpen}
            onClose={() => setIsSearchModalOpen(false)}
            eventId={eventId}
            alreadyMappedBoothIds={mappedBoothIds}
            onSelect={handleSelectBooth}
        />
    </div>
  );
}

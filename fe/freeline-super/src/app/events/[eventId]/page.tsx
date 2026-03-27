"use client";

import React, {useState, useEffect, useRef} from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { EditEventModal } from "@/components/EditEventModal";
import {BoothMapEditor} from "@/components/map/BoothMapEditor";
import {BoothSearchModal} from "@/components/map/BoothSearchModal";
import {eventApi, Event} from "@/lib/api/event";
import { authApi } from "@/lib/api/auth";
import {boothMapApi} from "@/lib/api/boothMap";
import { useModal } from "@/context/ModalContext";
import {useLeaveConfirm} from "@/hooks/useLeaveConfirm";
import { 
  Map as MapIcon, 
  Upload,
    Calendar,
    MapPin,
    Loader2,
    Save,
    ZoomIn,
    ZoomOut,
    RotateCcw
} from "lucide-react";

interface AreaItem {
    readonly boothId: number | null;
    readonly boothName?: string;
    readonly locationCode?: string;
    readonly adminName?: string;
    readonly contact?: string;
    readonly color?: string;
    readonly xRatio: number;
    readonly yRatio: number;
    readonly widthRatio: number;
    readonly heightRatio: number;
    readonly localId: string;
}

export default function EventDetailPage() {
  const params = useParams();
    const eventId = Number(params.eventId as string);
  const router = useRouter();
  const { showAlert, showConfirm } = useModal();

  const [event, setEvent] = useState<Event | null>(null);
  const [userName, setUserName] = useState("관리자");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Map state
    const [layoutImageUrl, setLayoutImageUrl] = useState<string | null>(null);
    const [eventMapId, setEventMapId] = useState<number | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [mapStatus, setMapStatus] = useState<"NONE" | "DRAFT" | "PUBLISHED">("NONE");
    const [areas, setAreas] = useState<AreaItem[]>([]);
    const [originalAreas, setOriginalAreas] = useState<AreaItem[]>([]);
    const [areasHistory, setAreasHistory] = useState<AreaItem[][]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Container dimensions
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({width: 0, height: 0});

    // Zoom & Pan state
    const [zoomLevel, setZoomLevel] = useState(1);
    const [zoomOrigin, setZoomOrigin] = useState({x: '50%', y: '50%'});
    const [panPosition, setPanPosition] = useState({x: 0, y: 0});
    const isPanningRef = useRef(false);
    const lastPanMousePositionRef = useRef({x: 0, y: 0});

    // Search Modal state
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [activeLocalId, setActiveLocalId] = useState<string | null>(null);

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Warn before leaving if unsaved changes exist
    useLeaveConfirm(hasUnsavedChanges);

    const fetchUserInfo = async () => {
        const userRes = await authApi.getMe();
        if (userRes.data?.success && userRes.data?.data?.name) {
            setUserName(userRes.data.data.name);
        }
    };

    const fetchEventDetail = async () => {
        const eventRes = await eventApi.getEvent(eventId.toString());
        let detail = null;
        if (eventRes.data?.success && eventRes.data?.data) {
            detail = eventRes.data.data;
        } else if ((eventRes.data as any)?.eventId) {
            detail = eventRes.data;
        }

        if (detail !== null) {
            setEvent(detail as Event);
        }
    };

    const fetchMapData = async () => {
        try {
            const mapRes = await boothMapApi.getBoothMap(eventId);
            if (!mapRes.data?.success || !mapRes.data?.data) return;

            const data = mapRes.data.data;
            setLayoutImageUrl(data.mapImageUrl);
            setEventMapId(data.eventMapId);

            if (data.booths?.length > 0) {
                const mappedAreas = data.booths.map((b: any) => ({
                    localId: `db-${b.areaId || b.boothId}`,
                    boothId: b.boothId,
                    boothName: b.boothName,
                    xRatio: b.xRatio,
                    yRatio: b.yRatio,
                    widthRatio: b.widthRatio,
                    heightRatio: b.heightRatio,
                }));
                setAreas(mappedAreas);
                setOriginalAreas(mappedAreas);
                setMapStatus("PUBLISHED");
            } else if (data.drafts?.length > 0) {
                const newDrafts = data.drafts.map((d: any, idx: number) => ({
                    localId: `ai-draft-${idx}-${Date.now()}`,
                    boothId: null,
                    xRatio: d.xRatio,
                    yRatio: d.yRatio,
                    widthRatio: d.widthRatio,
                    heightRatio: d.heightRatio,
                }));
                setAreas(newDrafts);
                setOriginalAreas(newDrafts);
                setMapStatus("DRAFT");
            } else {
                setAreas([]);
                setOriginalAreas([]);
                setMapStatus("NONE");
            }
        } catch (mapErr) {
            console.log("No map data found for this event", mapErr);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                await Promise.all([fetchUserInfo(), fetchEventDetail(), fetchMapData()]);
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
        globalThis.addEventListener("resize", updateSize);
        return () => globalThis.removeEventListener("resize", updateSize);
    }, [layoutImageUrl]);

    useEffect(() => {
        return () => {
            if (layoutImageUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(layoutImageUrl);
            }
        };
    }, [layoutImageUrl]);

    // Prevent default scroll when using Alt+Wheel on map container
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (e.altKey) {
                e.preventDefault();
            }
        };
        const el = containerRef.current;
        if (el) {
            el.addEventListener('wheel', handleWheel, {passive: false});
        }
        return () => {
            if (el) {
                el.removeEventListener('wheel', handleWheel);
            }
        };
    }, []);

    const handleToggleEditMode = () => {
        if (isEditMode) {
            if (hasUnsavedChanges) {
                showConfirm("저장되지 않은 변경사항이 있습니다. 보기 모드로 이동하면 변경사항이 취소됩니다. 이동하시겠습니까?", () => {
                    setAreas(originalAreas);
                    setAreasHistory([]);
                    setHasUnsavedChanges(false);
                    setIsEditMode(false);
                });
            } else {
                setIsEditMode(false);
            }
        } else {
            setIsEditMode(true);
        }
    };

    const handleAreasChange = (newAreas: AreaItem[]) => {
        setAreasHistory(prev => [...prev, areas]);
        setAreas(newAreas);
        setHasUnsavedChanges(true);
    };

    const handleUndo = () => {
        if (areasHistory.length === 0) return;
        const previousAreas = areasHistory.at(-1);
        if (previousAreas) {
            setAreas(previousAreas);
            setAreasHistory(prev => prev.slice(0, -1));
            setHasUnsavedChanges(true);
        }
    };

    const handleLayoutUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsLoading(true);
            const res = await boothMapApi.uploadMapImage(eventId, file, true);

            if (res.data?.success && res.data?.data) {
                const data = res.data.data;
                setLayoutImageUrl(data.imagePath);
                setEventMapId(data.eventMapId);

                // AI Drafts processing
                if (data.drafts?.length > 0) {
                    const newDrafts = data.drafts.map((d: any, idx: number) => ({
                        localId: `ai-draft-${idx}-${Date.now()}`,
                        boothId: null,
                        xRatio: d.xRatio,
                        yRatio: d.yRatio,
                        widthRatio: d.widthRatio,
                        heightRatio: d.heightRatio,
                    }));
                    setAreas(newDrafts);
                    setOriginalAreas(newDrafts);
                    setMapStatus("DRAFT");
                    setHasUnsavedChanges(true);
                    setIsEditMode(true); // Automatically enter edit mode
                } else {
                    setAreas([]);
                    setOriginalAreas([]);
                    setMapStatus("NONE");
                    setHasUnsavedChanges(false);
                }
            }
        } catch (err: any) {
            const errorStatus = err.response?.data?.status || err.response?.data?.error?.status;
            const message = errorStatus === "INVALID_IMAGE_FORMAT"
                ? "지원하지 않는 이미지 포맷이거나 손상된 파일입니다."
                : "지도 업로드에 실패했습니다.";
            showAlert(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveMap = async () => {
        if (eventMapId === null) return;

        const hasUnmapped = areas.some(a => a.boothId === null);
        if (hasUnmapped) {
            showConfirm("설정되지 않은 부스가 있습니다. 임시저장하시겠습니까?", async () => {
                await handleTempSave();
            });
            return;
        }

        // Filter out unmapped areas
        const validAreas = areas.filter(a => a.boothId !== null).map(a => ({
            boothId: a.boothId as number,
            xRatio: a.xRatio,
            yRatio: a.yRatio,
            widthRatio: a.widthRatio,
            heightRatio: a.heightRatio
        }));

        try {
            setIsSaving(true);
            await boothMapApi.updateBoothMapAreas(eventId, eventMapId, validAreas);
            setOriginalAreas(areas);
            setMapStatus("PUBLISHED");
            setIsEditMode(false);
            setHasUnsavedChanges(false);
            showAlert("저장되었습니다.");
        } catch (err) {
            console.error("Failed to save map areas", err);
            showAlert("지도 저장에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleTempSave = async () => {
        if (eventMapId === null) return;
        try {
            setIsSaving(true);
            await boothMapApi.updateBoothMapSnapshot(eventId, eventMapId, {areas});
            setOriginalAreas(areas);
            setMapStatus("DRAFT");
            setHasUnsavedChanges(false);
            showAlert("임시저장되었습니다.");
        } catch (err) {
            console.error("Failed to save snapshot", err);
            showAlert("임시저장에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddArea = () => {
        setAreasHistory(prev => [...prev, areas]);
        const newArea = {
            localId: `new-${Date.now()}`,
            boothId: null,
            xRatio: 0.45,
            yRatio: 0.45,
            widthRatio: 0.1,
            heightRatio: 0.1,
        };
        setAreas(prev => {
            setHasUnsavedChanges(true);
            return [...prev, newArea];
        });
    };

    const handleOpenSearchModal = (localId: string) => {
        setActiveLocalId(localId);
        setIsSearchModalOpen(true);
    };

    const handleSelectBooth = (data: {
        boothId: number | null;
        boothName: string;
        locationCode: string;
        adminName: string;
        contact: string;
        color: string;
    }) => {
        if (activeLocalId === null) return;
        setAreasHistory(prev => [...prev, areas]);

        setAreas(prev => {
            setHasUnsavedChanges(true);
            return prev.map(area => {
                if (area.localId === activeLocalId) {
                    return {
                        ...area,
                        boothId: data.boothId,
                        boothName: data.boothName,
                        locationCode: data.locationCode,
                        adminName: data.adminName,
                        contact: data.contact,
                        color: data.color
                    };
                }
                return area;
            });
        });

        setIsSearchModalOpen(false);
        setActiveLocalId(null);
    };

    const handleDeleteArea = () => {
        if (activeLocalId === null) return;
        setAreasHistory(prev => [...prev, areas]);

        setAreas(prev => {
            const next = prev.filter(area => area.localId !== activeLocalId);
            setHasUnsavedChanges(true);
            return next;
        });
        setIsSearchModalOpen(false);
        setActiveLocalId(null);
    };

    if (isLoading && layoutImageUrl === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F1F3F5]">
        <Loader2 className="w-12 h-12 animate-spin text-[#2D2A4A]" />
      </div>
    );
  }

    if (event === null) {
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
    const currentActiveArea = areas.find(a => a.localId === activeLocalId);
    const currentBoothId = currentActiveArea?.boothId ?? null;

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
                <span>{event.startDate.replaceAll('-', '.')} ~ {event.endDate.replaceAll('-', '.')}</span>
            </div>
            <div className="flex items-center gap-2.5 text-[24px] font-bold text-gray-500 mt-0.5">
              <MapPin className="w-6 h-6" />
              <span>{event.locationAddress || "장소 정보 없음"}</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
          <div
              className="w-full max-w-7xl mx-auto bg-white rounded-[40px] shadow-sm border border-gray-100 p-10 flex flex-col relative overflow-hidden min-h-162.5">

          {/* Status Indicators with Edit Button */}
          <div className="flex items-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#10B981]" />
                <span className="text-[13px] font-bold text-gray-600">원활</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#F59E0B]" />
                <span className="text-[13px] font-bold text-gray-600">보통</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#EF4444]" />
                <span className="text-[13px] font-bold text-gray-600">혼잡</span>
            </div>
              <div className="ml-auto flex gap-3">
                  {layoutImageUrl && (
                      <>
                          {isEditMode ? (
                              <>
                                  <button
                                      onClick={handleUndo}
                                      disabled={areasHistory.length === 0}
                                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-black text-[15px] hover:bg-gray-200 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                      이전으로
                                  </button>
                                  <button
                                      onClick={handleAddArea}
                                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-100 text-blue-700 rounded-xl font-black text-[15px] hover:bg-blue-200 transition-all shadow-sm"
                                  >
                                      <MapPin className="w-5 h-5"/>
                                      영역 추가
                                  </button>
                              </>
                          ) : (
                              <>
                                  <input
                                      type="file"
                                      id="layout-upload-overlay"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={handleLayoutUpload}
                                  />
                                  <label
                                      htmlFor="layout-upload-overlay"
                                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-black text-[15px] hover:bg-gray-200 transition-all shadow-sm cursor-pointer"
                                  >
                                      <Upload className="w-5 h-5"/>
                                      새 지도 업로드
                                  </label>
                              </>
                          )}
                          <button
                              onClick={handleToggleEditMode}
                              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[15px] transition-all shadow-sm ${isEditMode ? "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50" : "bg-[#DBFC53] text-[#2D2A4A] hover:bg-[#c9e846]"}`}
                          >
                              {isEditMode ? "보기 모드" : "편집 모드"}
                          </button>
                      </>
                  )}
            </div>
          </div>

          {/* Map Layout Area */}
              <div
                  ref={containerRef}
                  className="flex-1 bg-[#F1F3F5] rounded-[32px] flex items-center justify-center border-2 border-dashed border-gray-200 overflow-hidden relative group"
                  role="region"
                  aria-label="Map view"
                  tabIndex={0}
                  onWheel={(e) => {
                      if (e.altKey) {
                          e.preventDefault();
                          if (!containerRef.current) return;

                          const rect = containerRef.current.getBoundingClientRect();
                          const x = ((e.clientX - rect.left) / rect.width) * 100;
                          const y = ((e.clientY - rect.top) / rect.height) * 100;

                          // Only set origin if we are actually zooming
                          setZoomOrigin({x: `${x}%`, y: `${y}%`});

                          setZoomLevel(prev => {
                              const newZoom = e.deltaY < 0 ? prev + 0.1 : prev - 0.1;
                              return Math.min(Math.max(0.5, newZoom), 3);
                          });
                      }
                  }}
                  onMouseDown={(e) => {
                      if (e.altKey) {
                          e.preventDefault();
                          isPanningRef.current = true;
                          lastPanMousePositionRef.current = {x: e.clientX, y: e.clientY};
                      }
                  }}
                  onMouseMove={(e) => {
                      if (isPanningRef.current) {
                          const deltaX = e.clientX - lastPanMousePositionRef.current.x;
                          const deltaY = e.clientY - lastPanMousePositionRef.current.y;
                          setPanPosition(prev => ({
                              x: prev.x + deltaX,
                              y: prev.y + deltaY
                          }));
                          lastPanMousePositionRef.current = {x: e.clientX, y: e.clientY};
                      }
                  }}
                  onMouseUp={() => {
                      isPanningRef.current = false;
                  }}
                  onMouseLeave={() => {
                      isPanningRef.current = false;
                  }}
                  style={{
                      cursor: isPanningRef.current ? 'grabbing' : 'default'
                  }}
              >
                  {/* Temporary Save Badge */}
                  {!isEditMode && mapStatus === 'DRAFT' && layoutImageUrl && (
                      <div
                          className="absolute top-4 left-4 z-50 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full shadow-md font-bold text-sm flex items-center gap-2 border border-yellow-300">
                          <span>⚠️</span>
                          임시 저장된 데이터가 있습니다.
                      </div>
                  )}

                  {/* Floating Zoom Controls */}
                  {layoutImageUrl && (
                      <div
                          className="absolute top-4 right-4 z-50 flex flex-col items-center bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200 overflow-hidden transition-opacity opacity-70 hover:opacity-100">
                          <button
                              onClick={() => {
                                  setZoomOrigin({x: '50%', y: '50%'});
                                  setZoomLevel(prev => Math.min(3, prev + 0.1));
                              }}
                              className="p-2 hover:bg-gray-100 transition-colors text-gray-600"
                              title="확대"
                          >
                              <ZoomIn className="w-5 h-5"/>
                          </button>
                          <button
                              onClick={() => {
                                  setZoomOrigin({x: '50%', y: '50%'});
                                  setZoomLevel(prev => Math.max(0.5, prev - 0.1));
                              }}
                              className="p-2 hover:bg-gray-100 transition-colors text-gray-600"
                              title="축소"
                          >
                              <ZoomOut className="w-5 h-5"/>
                          </button>
                          <div className="h-[1px] w-6 bg-gray-200 my-1"></div>
                          <button
                              onClick={() => {
                                  setZoomLevel(1);
                                  setPanPosition({x: 0, y: 0});
                                  setZoomOrigin({x: '50%', y: '50%'});
                              }}
                              className="p-2 hover:bg-gray-100 transition-colors text-gray-600"
                              title="원래 크기"
                          >
                              <RotateCcw className="w-4 h-4"/>
                          </button>
                      </div>
                  )}

            {layoutImageUrl ? (
                <div
                    style={{
                        transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
                        transformOrigin: `${zoomOrigin.x} ${zoomOrigin.y}`,
                        transition: isPanningRef.current ? 'none' : 'transform 0.2s ease-out',
                        width: '100%',
                        height: '100%'
                    }}
                >
                    <BoothMapEditor
                        layoutImageUrl={layoutImageUrl}
                        initialAreas={areas}
                        isEditMode={isEditMode}
                        containerWidth={containerSize.width}
                        containerHeight={containerSize.height}
                        onOpenSearchModal={handleOpenSearchModal}
                        onAreasChange={handleAreasChange}
                        zoomLevel={zoomLevel}
                        hideBackground={!isEditMode && mapStatus === 'PUBLISHED'}
                    />
                </div>
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
              </div>

              {/* Action Buttons (Save) */}
              <div className="flex justify-end gap-3 mt-6 min-h-[56px]">
                  {layoutImageUrl && isEditMode && (
                      <>
                          <button
                              onClick={handleTempSave}
                              disabled={isSaving}
                              className="flex items-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-2xl font-black text-[16px] hover:bg-green-200 transition-all shadow-sm disabled:opacity-50"
                          >
                              {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>}
                              임시저장
                          </button>
                          <button
                              onClick={handleSaveMap}
                              disabled={isSaving}
                              className="flex items-center gap-2 px-6 py-3 bg-[#2D2A4A] text-white rounded-2xl font-black text-[16px] hover:scale-105 transition-all shadow-md active:scale-95 disabled:opacity-50"
                          >
                              {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>}
                              저장하기
                          </button>
                      </>
                  )}
              </div>
        </div>
      </main>

      <EditEventModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
            globalThis.location.reload();
        }}
        event={event}
      />

        <BoothSearchModal
            isOpen={isSearchModalOpen}
            onClose={() => setIsSearchModalOpen(false)}
            eventId={eventId}
            alreadyMappedBoothIds={mappedBoothIds}
            currentBoothId={currentBoothId}
            currentData={currentActiveArea}
            onSelect={handleSelectBooth}
            onDeleteArea={handleDeleteArea}
        />
    </div>
  );
}

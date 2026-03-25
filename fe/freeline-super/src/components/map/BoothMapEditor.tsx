"use client";

import React, {useState, useEffect} from "react";
import {Rnd} from "react-rnd";
import {Plus, Trash2} from "lucide-react";

interface AreaItem {
    boothId: number | null;
    boothName?: string;
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
    localId: string; // for rendering
}

interface BoothMapEditorProps {
    layoutImageUrl: string;
    initialAreas: AreaItem[];
    isEditMode: boolean;
    onOpenSearchModal: (localId: string) => void;
    onAreasChange: (areas: AreaItem[]) => void;
    containerWidth: number;
    containerHeight: number;
}

export function BoothMapEditor({
                                   layoutImageUrl,
                                   initialAreas,
                                   isEditMode,
                                   onOpenSearchModal,
                                   onAreasChange,
                                   containerWidth,
                                   containerHeight,
                               }: BoothMapEditorProps) {
    const [areas, setAreas] = useState<AreaItem[]>(initialAreas);

    useEffect(() => {
        setAreas(initialAreas);
    }, [initialAreas]);

    // 비율(Ratio) -> 픽셀(Pixel) 변환
    const toPixel = (ratio: number, max: number) => Math.round(ratio * max);

    // 픽셀(Pixel) -> 비율(Ratio) 변환
    const toRatio = (pixel: number, max: number) => {
        if (max === 0) return 0;
        return Number((pixel / max).toFixed(4));
    };

    const handleDragStop = (localId: string, d: { x: number; y: number }) => {
        if (!isEditMode) return;
        const newAreas = areas.map((area) => {
            if (area.localId === localId) {
                return {
                    ...area,
                    xRatio: toRatio(d.x, containerWidth),
                    yRatio: toRatio(d.y, containerHeight),
                };
            }
            return area;
        });
        setAreas(newAreas);
        onAreasChange(newAreas);
    };

    const handleResizeStop = (localId: string, ref: HTMLElement, position: { x: number; y: number }) => {
        if (!isEditMode) return;
        const newAreas = areas.map((area) => {
            if (area.localId === localId) {
                return {
                    ...area,
                    widthRatio: toRatio(ref.offsetWidth, containerWidth),
                    heightRatio: toRatio(ref.offsetHeight, containerHeight),
                    xRatio: toRatio(position.x, containerWidth),
                    yRatio: toRatio(position.y, containerHeight),
                };
            }
            return area;
        });
        setAreas(newAreas);
        onAreasChange(newAreas);
    };

    const handleDelete = (localId: string) => {
        const newAreas = areas.filter((a) => a.localId !== localId);
        setAreas(newAreas);
        onAreasChange(newAreas);
    };

    return (
        <div
            className="relative w-full h-full"
            style={{
                backgroundImage: `url(${layoutImageUrl})`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
            }}
        >
            {areas.map((area) => (
                <Rnd
                    key={area.localId}
                    size={{
                        width: toPixel(area.widthRatio, containerWidth),
                        height: toPixel(area.heightRatio, containerHeight),
                    }}
                    position={{
                        x: toPixel(area.xRatio, containerWidth),
                        y: toPixel(area.yRatio, containerHeight),
                    }}
                    onDragStop={(e, d) => handleDragStop(area.localId, d)}
                    onResizeStop={(e, direction, ref, delta, position) =>
                        handleResizeStop(area.localId, ref, position)
                    }
                    disableDragging={!isEditMode}
                    enableResizing={isEditMode}
                    bounds="parent"
                    className={`absolute flex items-center justify-center border-2 ${
                        area.boothId
                            ? "border-blue-500 bg-blue-500/20"
                            : "border-red-400 bg-red-400/20 border-dashed"
                    } transition-colors group`}
                >
                    {/* View Mode (Read Only) */}
                    {!isEditMode && area.boothName && (
                        <div
                            className="bg-white/90 text-gray-800 text-xs font-bold px-2 py-1 rounded shadow-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                            {area.boothName}
                        </div>
                    )}

                    {/* Edit Mode Controls */}
                    {isEditMode && (
                        <div
                            className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenSearchModal(area.localId);
                                }}
                                className="bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 shadow-md"
                                title={area.boothId ? "매핑 변경" : "부스 매핑"}
                            >
                                <Plus className="w-4 h-4"/>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(area.localId);
                                }}
                                className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md"
                                title="영역 삭제"
                            >
                                <Trash2 className="w-4 h-4"/>
                            </button>
                        </div>
                    )}

                    {isEditMode && area.boothName && (
                        <div
                            className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap">
                            {area.boothName}
                        </div>
                    )}
                </Rnd>
            ))}
        </div>
    );
}

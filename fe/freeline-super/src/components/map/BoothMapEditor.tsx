"use client";

import React, {useState, useEffect, useRef} from "react";
import {Rnd} from "react-rnd";

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
    const [imageSize, setImageSize] = useState({width: 0, height: 0});
    const isDraggingRef = useRef(false);

    useEffect(() => {
        setAreas(initialAreas);
    }, [initialAreas]);

    useEffect(() => {
        if (!layoutImageUrl) return;
        const img = new window.Image();
        img.onload = () => {
            setImageSize({width: img.naturalWidth, height: img.naturalHeight});
        };
        img.src = layoutImageUrl;
    }, [layoutImageUrl]);

    // Calculate effective dimensions based on object-fit: contain logic
    let effectiveWidth = containerWidth;
    let effectiveHeight = containerHeight;

    if (imageSize.width > 0 && imageSize.height > 0 && containerWidth > 0 && containerHeight > 0) {
        const containerRatio = containerWidth / containerHeight;
        const imageRatio = imageSize.width / imageSize.height;

        if (containerRatio > imageRatio) {
            // Container is wider than image
            effectiveHeight = containerHeight;
            effectiveWidth = effectiveHeight * imageRatio;
        } else {
            // Container is taller than image
            effectiveWidth = containerWidth;
            effectiveHeight = effectiveWidth / imageRatio;
        }
    }

    // 비율(Ratio) -> 픽셀(Pixel) 변환
    const toPixel = (ratio: number, max: number) => Math.round(ratio * max);

    // 픽셀(Pixel) -> 비율(Ratio) 변환
    const toRatio = (pixel: number, max: number) => {
        if (max === 0) return 0;
        return Number((pixel / max).toFixed(4));
    };

    const handleDragStart = () => {
        isDraggingRef.current = true;
    };

    const handleDragStop = (localId: string, d: { x: number; y: number }) => {
        if (!isEditMode) return;
        const newAreas = areas.map((area) => {
            if (area.localId === localId) {
                return {
                    ...area,
                    xRatio: toRatio(d.x, effectiveWidth),
                    yRatio: toRatio(d.y, effectiveHeight),
                };
            }
            return area;
        });
        setAreas(newAreas);
        onAreasChange(newAreas);
        setTimeout(() => {
            isDraggingRef.current = false;
        }, 100); // 딜레이를 주어 클릭 이벤트와 충돌 방지
    };

    const handleResizeStart = () => {
        isDraggingRef.current = true;
    };

    const handleResizeStop = (localId: string, ref: HTMLElement, position: { x: number; y: number }) => {
        if (!isEditMode) return;
        const newAreas = areas.map((area) => {
            if (area.localId === localId) {
                return {
                    ...area,
                    widthRatio: toRatio(ref.offsetWidth, effectiveWidth),
                    heightRatio: toRatio(ref.offsetHeight, effectiveHeight),
                    xRatio: toRatio(position.x, effectiveWidth),
                    yRatio: toRatio(position.y, effectiveHeight),
                };
            }
            return area;
        });
        setAreas(newAreas);
        onAreasChange(newAreas);
        setTimeout(() => {
            isDraggingRef.current = false;
        }, 100); // 딜레이를 주어 클릭 이벤트와 충돌 방지
    };

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <div
                className="relative"
                style={{
                    width: effectiveWidth,
                    height: effectiveHeight,
                    backgroundImage: `url(${layoutImageUrl})`,
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                }}
            >
                {areas.map((area) => (
                    <Rnd
                        key={area.localId}
                        size={{
                            width: toPixel(area.widthRatio, effectiveWidth),
                            height: toPixel(area.heightRatio, effectiveHeight),
                        }}
                        position={{
                            x: toPixel(area.xRatio, effectiveWidth),
                            y: toPixel(area.yRatio, effectiveHeight),
                        }}
                        onDragStart={handleDragStart}
                        onDragStop={(e, d) => handleDragStop(area.localId, d)}
                        onResizeStart={handleResizeStart}
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
                        } transition-colors group cursor-pointer`}
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            if (isEditMode && !isDraggingRef.current) {
                                onOpenSearchModal(area.localId);
                            }
                        }}
                    >
                        {/* View Mode (Read Only) */}
                        {!isEditMode && area.boothName && (
                            <div
                                className="bg-white/90 text-gray-800 text-xs font-bold px-2 py-1 rounded shadow-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                                {area.boothName}
                            </div>
                        )}

                        {/* Edit Mode (Booth Name Display) */}
                        {isEditMode && area.boothName && (
                            <div
                                className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap pointer-events-none">
                                {area.boothName}
                            </div>
                        )}
                    </Rnd>
                ))}
            </div>
        </div>
    );
}
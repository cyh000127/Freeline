"use client";

import React, {useState, useEffect, useRef} from "react";
import {Rnd} from "react-rnd";

interface AreaItem {
    boothId: number | null;
    boothName?: string;
    locationCode?: string;
    adminName?: string;
    contact?: string;
    color?: string;
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
    localId: string; // for rendering
}

interface BoothMapEditorProps {
    readonly layoutImageUrl: string;
    readonly initialAreas: AreaItem[];
    readonly isEditMode: boolean;
    readonly onOpenSearchModal: (localId: string) => void;
    readonly onAreasChange: (areas: AreaItem[]) => void;
    readonly containerWidth: number;
    readonly containerHeight: number;
    readonly zoomLevel?: number;
    readonly hideBackground?: boolean;
}

// 비율(Ratio) -> 픽셀(Pixel) 변환
const toPixel = (ratio: number, max: number) => Math.round(ratio * max);

// 픽셀(Pixel) -> 비율(Ratio) 변환
const toRatio = (pixel: number, max: number) => {
    if (max === 0) return 0;
    return Number((pixel / max).toFixed(4));
};

export function BoothMapEditor({
                                   layoutImageUrl,
                                   initialAreas,
                                   isEditMode,
                                   onOpenSearchModal,
                                   onAreasChange,
                                   containerWidth,
                                   containerHeight,
                                   zoomLevel = 1,
                                   hideBackground = false,
                               }: BoothMapEditorProps) {
    const [areas, setAreas] = useState<AreaItem[]>(initialAreas);
    const [imageSize, setImageSize] = useState({width: 0, height: 0});
    const isDraggingRef = useRef(false);

    // Multi-selection states
    const [selectedLocalIds, setSelectedLocalIds] = useState<string[]>([]);
    const [selectionBox, setSelectionBox] = useState<{
        startX: number;
        startY: number;
        endX: number;
        endY: number
    } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isEditMode) {
            setSelectedLocalIds([]);
            setSelectionBox(null);
        }
    }, [isEditMode]);

    useEffect(() => {
        setAreas(initialAreas);
        // Do not clear selection automatically here because it clears when items change due to drag
    }, [initialAreas]);

    useEffect(() => {
        if (!layoutImageUrl) return;
        const img = new globalThis.Image();
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

    const dragStartPositions = useRef<{ [key: string]: { xRatio: number, yRatio: number } }>({});

    const handleDragStart = (localId: string) => {
        isDraggingRef.current = true;

        const positions: { [key: string]: { xRatio: number, yRatio: number } } = {};
        areas.forEach(area => {
            if (selectedLocalIds.includes(area.localId) || area.localId === localId) {
                positions[area.localId] = {xRatio: area.xRatio, yRatio: area.yRatio};
            }
        });
        dragStartPositions.current = positions;
    };

    const handleDrag = (localId: string, d: { x: number; y: number }) => {
        if (!isEditMode) return;
        const startPos = dragStartPositions.current[localId];
        if (!startPos) return;

        const newXRatio = toRatio(d.x, effectiveWidth);
        const newYRatio = toRatio(d.y, effectiveHeight);

        const diffX = newXRatio - startPos.xRatio;
        const diffY = newYRatio - startPos.yRatio;

        const isSelected = selectedLocalIds.includes(localId);
        const idsToMove = isSelected ? selectedLocalIds : [localId];

        if (idsToMove.length <= 1) return;

        setAreas(prevAreas => prevAreas.map(area => {
            if (idsToMove.includes(area.localId)) {
                const initial = dragStartPositions.current[area.localId] || area;
                return {
                    ...area,
                    xRatio: Number((initial.xRatio + diffX).toFixed(4)),
                    yRatio: Number((initial.yRatio + diffY).toFixed(4)),
                };
            }
            return area;
        }));
    };

    const handleDragStop = (localId: string, d: { x: number; y: number }) => {
        if (!isEditMode) return;

        const startPos = dragStartPositions.current[localId];
        let calculatedAreas: AreaItem[];

        if (startPos) {
            const newXRatio = toRatio(d.x, effectiveWidth);
            const newYRatio = toRatio(d.y, effectiveHeight);

            const diffX = newXRatio - startPos.xRatio;
            const diffY = newYRatio - startPos.yRatio;

            const isSelected = selectedLocalIds.includes(localId);
            const idsToMove = isSelected ? selectedLocalIds : [localId];

            calculatedAreas = areas.map((area) => {
                if (idsToMove.includes(area.localId)) {
                    const initial = dragStartPositions.current[area.localId] || area;
                    return {
                        ...area,
                        xRatio: Number((initial.xRatio + diffX).toFixed(4)),
                        yRatio: Number((initial.yRatio + diffY).toFixed(4)),
                    };
                }
                return area;
            });
        } else {
            calculatedAreas = areas.map((area) => {
                if (area.localId === localId) {
                    return {
                        ...area,
                        xRatio: toRatio(d.x, effectiveWidth),
                        yRatio: toRatio(d.y, effectiveHeight),
                    };
                }
                return area;
            });
        }

        setAreas(calculatedAreas);
        onAreasChange(calculatedAreas);
        dragStartPositions.current = {};
        setTimeout(() => {
            isDraggingRef.current = false;
        }, 100);
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

    // --- 마우스 드래그 다중 선택 이벤트 ---
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isEditMode) return;

        // Rnd(도형) 내부를 클릭한 경우 선택 박스를 그리지 않음
        if ((e.target as HTMLElement).closest('.react-draggable')) {
            return;
        }

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setSelectionBox({startX: x, startY: y, endX: x, endY: y});
        setSelectedLocalIds([]); // 빈 배경 클릭 시 선택 초기화
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isEditMode || !selectionBox) return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setSelectionBox(prev => prev ? {...prev, endX: x, endY: y} : null);
    };

    const handleMouseUp = () => {
        if (!isEditMode || !selectionBox) return;

        const {startX, startY, endX, endY} = selectionBox;

        const minX = Math.min(startX, endX);
        const maxX = Math.max(startX, endX);
        const minY = Math.min(startY, endY);
        const maxY = Math.max(startY, endY);

        const minXRatio = toRatio(minX, effectiveWidth);
        const maxXRatio = toRatio(maxX, effectiveWidth);
        const minYRatio = toRatio(minY, effectiveHeight);
        const maxYRatio = toRatio(maxY, effectiveHeight);

        const selected = areas.filter(area => {
            return (
                area.xRatio < maxXRatio &&
                area.xRatio + area.widthRatio > minXRatio &&
                area.yRatio < maxYRatio &&
                area.yRatio + area.heightRatio > minYRatio
            );
        });

        setSelectedLocalIds(selected.map(a => a.localId));
        setSelectionBox(null);
    };

    const handleDeleteSelected = () => {
        if (!isEditMode || selectedLocalIds.length === 0) return;

        const newAreas = areas.filter(area => !selectedLocalIds.includes(area.localId));
        setAreas(newAreas);
        onAreasChange(newAreas);
        setSelectedLocalIds([]);
    };

    // --- Delete / Backspace 키보드 삭제 ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isEditMode) return;
            // 입력 폼에서 삭제하는 경우는 무시
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedLocalIds.length > 0) {
                    e.preventDefault(); // 뒤로가기 등 기본 동작 방지
                    handleDeleteSelected();
                }
            }
        };

        globalThis.addEventListener('keydown', handleKeyDown);
        return () => globalThis.removeEventListener('keydown', handleKeyDown);
    }, [isEditMode, selectedLocalIds, areas, onAreasChange]);

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <div
                ref={containerRef}
                className="relative overflow-hidden"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                role="region"
                aria-label="Booth map editor"
                tabIndex={0}
                style={{
                    width: effectiveWidth,
                    height: effectiveHeight,
                    backgroundImage: hideBackground ? 'none' : `url(${layoutImageUrl})`,
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    userSelect: selectionBox ? "none" : "auto", // 드래그 중 텍스트 선택 방지
                }}
            >
                {/* 다중 선택 박스 렌더링 */}
                {selectionBox && (
                    <div
                        style={{
                            position: 'absolute',
                            left: Math.min(selectionBox.startX, selectionBox.endX),
                            top: Math.min(selectionBox.startY, selectionBox.endY),
                            width: Math.abs(selectionBox.startX - selectionBox.endX),
                            height: Math.abs(selectionBox.startY - selectionBox.endY),
                            border: '1px dashed #3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            pointerEvents: 'none',
                            zIndex: 50,
                        }}
                    />
                )}
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
                        onDragStart={() => {
                            handleDragStart(area.localId);
                            if (isEditMode && !selectedLocalIds.includes(area.localId)) {
                                setSelectedLocalIds([area.localId]);
                            }
                        }}
                        onDrag={(e, d) => handleDrag(area.localId, d)}
                        onDragStop={(e, d) => handleDragStop(area.localId, d)}
                        onResizeStart={() => {
                            handleResizeStart();
                            if (isEditMode && !selectedLocalIds.includes(area.localId)) {
                                setSelectedLocalIds([area.localId]);
                            }
                        }}
                        onResizeStop={(e, direction, ref, delta, position) =>
                            handleResizeStop(area.localId, ref, position)
                        }
                        disableDragging={!isEditMode}
                        enableResizing={isEditMode}
                        bounds="parent"
                        className={`absolute flex items-center justify-center border-2 transition-colors group cursor-pointer ${
                            !area.color && (area.boothId
                                ? "border-blue-500 bg-blue-500/20"
                                : "border-red-400 bg-red-400/20 border-dashed")
                        } ${selectedLocalIds.includes(area.localId) ? "ring-2 ring-yellow-400 ring-offset-2 z-10" : ""}`}
                        style={{
                            backgroundColor: area.color ? `${area.color}33` : undefined,
                            borderColor: area.color || undefined,
                        }}
                        onMouseDown={(e: MouseEvent | TouchEvent) => {
                            if (!isEditMode) return;
                            if (e instanceof MouseEvent && e.shiftKey) {
                                setSelectedLocalIds(prev =>
                                    prev.includes(area.localId)
                                        ? prev.filter(id => id !== area.localId)
                                        : [...prev, area.localId]
                                );
                            } else {
                                // 단일 클릭 시 드래그 시작 전 임시 선택
                                setSelectedLocalIds([area.localId]);
                            }
                        }}
                        onMouseUp={(e: MouseEvent | TouchEvent) => {
                            if (!isEditMode) return;
                            // 드래그가 발생하지 않았고 Shift 키도 누르지 않았을 때 선택 해제 (단순 클릭 뗐을 때 해제)
                            const isShiftKey = e instanceof MouseEvent && e.shiftKey;
                            if (!isDraggingRef.current && !isShiftKey) {
                                setSelectedLocalIds([]);
                            }
                        }}
                        onDoubleClick={(e: MouseEvent | TouchEvent) => {
                            e.stopPropagation();
                            if (isEditMode) {
                                onOpenSearchModal(area.localId);
                            }
                        }}
                    >
                        {/* Booth Info Display (Centered) */}
                        {area.boothName && (
                            <div
                                className="flex flex-col items-center justify-center bg-white/90 text-gray-800 px-2 py-1 rounded shadow-sm overflow-hidden max-w-full pointer-events-none"
                            >
                                {area.locationCode && (
                                    <span
                                        className="text-[9px] font-semibold text-gray-500 mb-0.5 whitespace-nowrap text-ellipsis overflow-hidden max-w-full">
                                        {area.locationCode}
                                    </span>
                                )}
                                <span
                                    className="text-xs font-bold whitespace-nowrap text-ellipsis overflow-hidden max-w-full">
                                    {area.boothName}
                                </span>
                            </div>
                        )}
                    </Rnd>
                ))}
            </div>
        </div>
    );
}
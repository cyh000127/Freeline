"use client";

import React, {useEffect, useRef, useState} from "react";
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
    localId: string;
}

interface BoothMapEditorProps {
    readonly layoutImageUrl: string;
    readonly initialAreas: AreaItem[];
    readonly isEditMode: boolean;
    readonly onOpenSearchModal: (localId: string) => void;
    readonly onAreasChange: (areas: AreaItem[]) => void;
    readonly containerWidth: number;
    readonly containerHeight: number;
    readonly hideBackground?: boolean;
}

interface SelectionBox {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    mergeWithExisting: boolean;
}

const toPixel = (ratio: number, max: number) => Math.round(ratio * max);

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
                                   hideBackground = false,
                               }: BoothMapEditorProps) {
    const [areas, setAreas] = useState<AreaItem[]>(initialAreas);
    const [imageSize, setImageSize] = useState({width: 0, height: 0});
    const [selectedLocalIds, setSelectedLocalIds] = useState<string[]>([]);
    const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const dragStartPositions = useRef<Record<string, { xRatio: number; yRatio: number }>>({});
    const draggingLocalIdsRef = useRef<string[]>([]);

    useEffect(() => {
        if (!isEditMode) {
            setSelectedLocalIds([]);
            setSelectionBox(null);
        }
    }, [isEditMode]);

    useEffect(() => {
        setAreas(initialAreas);
    }, [initialAreas]);

    useEffect(() => {
        if (!layoutImageUrl) return;

        const image = new globalThis.Image();
        image.onload = () => {
            setImageSize({width: image.naturalWidth, height: image.naturalHeight});
        };
        image.src = layoutImageUrl;
    }, [layoutImageUrl]);

    let effectiveWidth = containerWidth;
    let effectiveHeight = containerHeight;

    if (imageSize.width > 0 && imageSize.height > 0 && containerWidth > 0 && containerHeight > 0) {
        const containerRatio = containerWidth / containerHeight;
        const imageRatio = imageSize.width / imageSize.height;

        if (containerRatio > imageRatio) {
            effectiveHeight = containerHeight;
            effectiveWidth = effectiveHeight * imageRatio;
        } else {
            effectiveWidth = containerWidth;
            effectiveHeight = effectiveWidth / imageRatio;
        }
    }

    const clampDragDiff = (idsToMove: string[], diffX: number, diffY: number, currentAreas: AreaItem[]) => {
        let minDiffX = Number.NEGATIVE_INFINITY;
        let maxDiffX = Number.POSITIVE_INFINITY;
        let minDiffY = Number.NEGATIVE_INFINITY;
        let maxDiffY = Number.POSITIVE_INFINITY;

        currentAreas.forEach((area) => {
            if (!idsToMove.includes(area.localId)) return;

            const initial = dragStartPositions.current[area.localId] || area;
            minDiffX = Math.max(minDiffX, -initial.xRatio);
            maxDiffX = Math.min(maxDiffX, 1 - area.widthRatio - initial.xRatio);
            minDiffY = Math.max(minDiffY, -initial.yRatio);
            maxDiffY = Math.min(maxDiffY, 1 - area.heightRatio - initial.yRatio);
        });

        return {
            diffX: Math.min(Math.max(diffX, minDiffX), maxDiffX),
            diffY: Math.min(Math.max(diffY, minDiffY), maxDiffY),
        };
    };

    const calculateDraggedAreas = (localId: string, d: { x: number; y: number }, currentAreas: AreaItem[]) => {
        const startPos = dragStartPositions.current[localId];
        if (!startPos) return currentAreas;

        const nextXRatio = toRatio(d.x, effectiveWidth);
        const nextYRatio = toRatio(d.y, effectiveHeight);
        const idsToMove = draggingLocalIdsRef.current.length > 0 ? draggingLocalIdsRef.current : [localId];
        const boundedDiff = clampDragDiff(
            idsToMove,
            nextXRatio - startPos.xRatio,
            nextYRatio - startPos.yRatio,
            currentAreas
        );

        return currentAreas.map((area) => {
            if (!idsToMove.includes(area.localId)) {
                return area;
            }

            const initial = dragStartPositions.current[area.localId] || area;
            return {
                ...area,
                xRatio: Number((initial.xRatio + boundedDiff.diffX).toFixed(4)),
                yRatio: Number((initial.yRatio + boundedDiff.diffY).toFixed(4)),
            };
        });
    };

    const handleDragStart = (localId: string) => {
        isDraggingRef.current = true;

        const idsToMove = selectedLocalIds.includes(localId) ? selectedLocalIds : [localId];
        draggingLocalIdsRef.current = idsToMove;
        setSelectedLocalIds(idsToMove);

        const positions: Record<string, { xRatio: number; yRatio: number }> = {};
        areas.forEach((area) => {
            if (idsToMove.includes(area.localId)) {
                positions[area.localId] = {xRatio: area.xRatio, yRatio: area.yRatio};
            }
        });

        dragStartPositions.current = positions;
    };

    const handleDrag = (localId: string, d: { x: number; y: number }) => {
        if (!isEditMode) return;
        setAreas((prevAreas) => calculateDraggedAreas(localId, d, prevAreas));
    };

    const handleDragStop = (localId: string, d: { x: number; y: number }) => {
        if (!isEditMode) return;

        const calculatedAreas = calculateDraggedAreas(localId, d, areas);
        setAreas(calculatedAreas);
        onAreasChange(calculatedAreas);
        dragStartPositions.current = {};
        draggingLocalIdsRef.current = [];
        setTimeout(() => {
            isDraggingRef.current = false;
        }, 100);
    };

    const handleResizeStart = (localId: string) => {
        isDraggingRef.current = true;
        setSelectedLocalIds((prev) => (prev.includes(localId) ? prev : [localId]));
    };

    const handleResizeStop = (localId: string, ref: HTMLElement, position: { x: number; y: number }) => {
        if (!isEditMode) return;

        const newAreas = areas.map((area) => {
            if (area.localId !== localId) {
                return area;
            }

            return {
                ...area,
                widthRatio: toRatio(ref.offsetWidth, effectiveWidth),
                heightRatio: toRatio(ref.offsetHeight, effectiveHeight),
                xRatio: toRatio(position.x, effectiveWidth),
                yRatio: toRatio(position.y, effectiveHeight),
            };
        });

        setAreas(newAreas);
        onAreasChange(newAreas);
        setTimeout(() => {
            isDraggingRef.current = false;
        }, 100);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isEditMode) return;
        if (e.altKey) return;

        if ((e.target as HTMLElement).closest(".react-draggable")) {
            return;
        }

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const mergeWithExisting = e.shiftKey || e.ctrlKey || e.metaKey;

        setSelectionBox({
            startX: x,
            startY: y,
            endX: x,
            endY: y,
            mergeWithExisting,
        });

        if (!mergeWithExisting) {
            setSelectedLocalIds([]);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isEditMode || !selectionBox) return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setSelectionBox((prev) => prev ? {...prev, endX: x, endY: y} : null);
    };

    const handleMouseUp = () => {
        if (!isEditMode || !selectionBox) return;

        const {startX, startY, endX, endY, mergeWithExisting} = selectionBox;
        const minXRatio = toRatio(Math.min(startX, endX), effectiveWidth);
        const maxXRatio = toRatio(Math.max(startX, endX), effectiveWidth);
        const minYRatio = toRatio(Math.min(startY, endY), effectiveHeight);
        const maxYRatio = toRatio(Math.max(startY, endY), effectiveHeight);

        const selectedIds = areas
            .filter((area) => (
                area.xRatio < maxXRatio &&
                area.xRatio + area.widthRatio > minXRatio &&
                area.yRatio < maxYRatio &&
                area.yRatio + area.heightRatio > minYRatio
            ))
            .map((area) => area.localId);

        setSelectedLocalIds((prev) => (
            mergeWithExisting ? Array.from(new Set([...prev, ...selectedIds])) : selectedIds
        ));
        setSelectionBox(null);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isEditMode) return;
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if ((e.key === "Delete" || e.key === "Backspace") && selectedLocalIds.length > 0) {
                e.preventDefault();

                const newAreas = areas.filter((area) => !selectedLocalIds.includes(area.localId));
                setAreas(newAreas);
                onAreasChange(newAreas);
                setSelectedLocalIds([]);
            }
        };

        globalThis.addEventListener("keydown", handleKeyDown);
        return () => globalThis.removeEventListener("keydown", handleKeyDown);
    }, [isEditMode, selectedLocalIds, areas, onAreasChange]);

    return (
        <div className="relative flex h-full w-full items-center justify-center">
            <div
                ref={containerRef}
                className="relative overflow-hidden"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                role="region"
                aria-label="Booth map editor"
                style={{
                    width: effectiveWidth,
                    height: effectiveHeight,
                    backgroundImage: hideBackground ? "none" : `url(${layoutImageUrl})`,
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    userSelect: selectionBox ? "none" : "auto",
                }}
            >
                {selectionBox && (
                    <div
                        style={{
                            position: "absolute",
                            left: Math.min(selectionBox.startX, selectionBox.endX),
                            top: Math.min(selectionBox.startY, selectionBox.endY),
                            width: Math.abs(selectionBox.startX - selectionBox.endX),
                            height: Math.abs(selectionBox.startY - selectionBox.endY),
                            border: "1px dashed #3b82f6",
                            backgroundColor: "rgba(59, 130, 246, 0.1)",
                            pointerEvents: "none",
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
                        onDragStart={() => handleDragStart(area.localId)}
                        onDrag={(e, d) => handleDrag(area.localId, d)}
                        onDragStop={(e, d) => handleDragStop(area.localId, d)}
                        onResizeStart={() => handleResizeStart(area.localId)}
                        onResizeStop={(e, direction, ref, delta, position) =>
                            handleResizeStop(area.localId, ref, position)
                        }
                        disableDragging={!isEditMode}
                        enableResizing={isEditMode}
                        bounds="parent"
                        className={`absolute border-2 transition-colors group cursor-pointer ${
                            !area.color && (area.boothId
                                ? "border-blue-500 bg-blue-500/20"
                                : "border-red-400 bg-red-400/20 border-dashed")
                        } ${selectedLocalIds.includes(area.localId) ? "z-10 ring-2 ring-yellow-400 ring-offset-2" : ""}`}
                        style={{
                            backgroundColor: area.color ? `${area.color}33` : undefined,
                            borderColor: area.color || undefined,
                        }}
                        onMouseDown={(e: MouseEvent | TouchEvent) => {
                            if (!isEditMode) return;
                            if (e instanceof MouseEvent && e.altKey) return;

                            const hasModifier = e instanceof MouseEvent && (e.shiftKey || e.ctrlKey || e.metaKey);
                            if (hasModifier) {
                                setSelectedLocalIds((prev) => (
                                    prev.includes(area.localId)
                                        ? prev.filter((id) => id !== area.localId)
                                        : [...prev, area.localId]
                                ));
                                return;
                            }

                            setSelectedLocalIds((prev) => (
                                prev.includes(area.localId) ? prev : [area.localId]
                            ));
                        }}
                        onDoubleClick={(e: MouseEvent | TouchEvent) => {
                            e.stopPropagation();
                            if (isEditMode) {
                                onOpenSearchModal(area.localId);
                            }
                        }}
                    >
                        {area.boothName && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-2">
                                <div
                                    className="flex max-w-full flex-col items-center justify-center rounded bg-white/90 px-2 py-1 text-center text-gray-800 shadow-sm">
                                    {area.locationCode && (
                                        <span
                                            className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[9px] font-semibold text-gray-500">
                                            {area.locationCode}
                                        </span>
                                    )}
                                    <span
                                        className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs font-bold leading-tight">
                                        {area.boothName}
                                    </span>
                                </div>
                            </div>
                        )}
                    </Rnd>
                ))}
            </div>
        </div>
    );
}

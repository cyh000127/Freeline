import React, {useState, useRef, useEffect, MouseEvent} from 'react';

export interface MapArea {
    id?: string; // used for internal React keys if boothId is missing
    boothId?: number;
    startX: number;
    startY: number;
    widthRatio: number;
    heightRatio: number;
}

export interface BoothData {
    boothId: number;
    name: string;
}

interface MapAreaEditorProps {
    imageUrl: string;
    areas: MapArea[];
    setAreas: React.Dispatch<React.SetStateAction<MapArea[]>>;
    booths: BoothData[];
    isEditMode: boolean;
}

export function MapAreaEditor({imageUrl, areas, setAreas, booths, isEditMode}: MapAreaEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Dragging state
    const [activeIdx, setActiveIdx] = useState<number | null>(null);
    const [dragAction, setDragAction] = useState<'move' | 'resize' | null>(null);

    // To calculate delta correctly
    const [startPos, setStartPos] = useState({x: 0, y: 0});
    const [startArea, setStartArea] = useState<MapArea | null>(null);

    const handlePointerDown = (e: React.PointerEvent, idx: number, action: 'move' | 'resize') => {
        if (!isEditMode) return;
        e.stopPropagation();

        // Set pointer capture to window or current target to allow dragging outside element
        e.currentTarget.setPointerCapture(e.pointerId);

        setActiveIdx(idx);
        setDragAction(action);
        setStartPos({x: e.clientX, y: e.clientY});
        setStartArea({...areas[idx]});
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isEditMode || activeIdx === null || dragAction === null || !startArea || !containerRef.current) return;

        const containerScaleX = containerRef.current.offsetWidth;
        const containerScaleY = containerRef.current.offsetHeight;

        if (containerScaleX === 0 || containerScaleY === 0) return;

        const deltaX = (e.clientX - startPos.x) / containerScaleX;
        const deltaY = (e.clientY - startPos.y) / containerScaleY;

        setAreas((prev) => {
            const newAreas = [...prev];
            const area = {...startArea};

            if (dragAction === 'move') {
                area.startX = Math.max(0, Math.min(1 - area.widthRatio, area.startX + deltaX));
                area.startY = Math.max(0, Math.min(1 - area.heightRatio, area.startY + deltaY));
            } else if (dragAction === 'resize') {
                area.widthRatio = Math.max(0.02, Math.min(1 - area.startX, area.widthRatio + deltaX));
                area.heightRatio = Math.max(0.02, Math.min(1 - area.startY, area.heightRatio + deltaY));
            }

            newAreas[activeIdx] = area;
            return newAreas;
        });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isEditMode) return;
        setActiveIdx(null);
        setDragAction(null);
        setStartArea(null);
    };

    const handleBoothSelect = (idx: number, boothId: string) => {
        setAreas((prev) => {
            const newAreas = [...prev];
            newAreas[idx] = {...newAreas[idx], boothId: boothId ? parseInt(boothId) : undefined};
            return newAreas;
        });
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            {/* Wrapper to match image aspect ratio exactly */}
            <div
                className="relative inline-block max-w-full max-h-full"
                style={{height: '100%'}} // Let width auto-adjust if image handles it, or use absolute wrapper
            >
                <img
                    src={imageUrl}
                    alt="Exhibition Layout"
                    className="max-h-full max-w-full object-contain pointer-events-none"
                />

                {/* Absolute layer matching the image exact size */}
                <div
                    ref={containerRef}
                    className="absolute inset-0"
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp} // End drag if cursor leaves
                >
                    {areas.map((area, idx) => {
                        const isHoveredOrActive = activeIdx === idx;
                        const hasAssignedBooth = !!area.boothId;
                        const displayBooth = booths.find(b => b.boothId === area.boothId);

                        return (
                            <div
                                key={area.id || `area-${idx}`}
                                className={`absolute border-2 transition-colors ${
                                    isEditMode ? 'cursor-move' : ''
                                } ${
                                    hasAssignedBooth ? 'border-[#10B981] bg-[#10B981]/20' : 'border-red-500 bg-red-500/20'
                                } hover:border-[#F59E0B] hover:bg-[#F59E0B]/30`}
                                style={{
                                    left: `${area.startX * 100}%`,
                                    top: `${area.startY * 100}%`,
                                    width: `${area.widthRatio * 100}%`,
                                    height: `${area.heightRatio * 100}%`,
                                    touchAction: 'none' // Prevent scrolling while dragging
                                }}
                                onPointerDown={(e) => handlePointerDown(e, idx, 'move')}
                            >
                                {/* Information / Dropdown Label */}
                                <div
                                    className="absolute top-1 left-1 bg-white/90 shadow-sm px-2 py-1 flex flex-col gap-1 rounded text-xs truncate max-w-[90%] font-bold text-gray-800"
                                    onPointerDown={e => e.stopPropagation()}>
                                    {isEditMode ? (
                                        <select
                                            className="border border-gray-300 rounded p-0.5 text-xs bg-white text-gray-800 focus:outline-none"
                                            value={area.boothId || ''}
                                            onChange={(e) => handleBoothSelect(idx, e.target.value)}
                                        >
                                            <option value="">부스 선택 안됨</option>
                                            {booths.map(b => (
                                                <option key={`booth-opt-${b.boothId}`} value={b.boothId}>
                                                    {b.name} (ID: {b.boothId})
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span>{hasAssignedBooth && displayBooth ? displayBooth.name : '미지정'}</span>
                                    )}
                                </div>

                                {/* Resize Handle (Bottom Right) */}
                                {isEditMode && (
                                    <div
                                        className="absolute right-0 bottom-0 w-4 h-4 bg-white border border-gray-400 cursor-se-resize touch-none z-10"
                                        onPointerDown={(e) => handlePointerDown(e, idx, 'resize')}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

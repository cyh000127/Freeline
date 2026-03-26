"use client";

import React, {useState, useEffect, useRef} from "react";
import {X, Search, Trash2} from "lucide-react";
import {api} from "@/lib/api/axios";

interface BoothSearchResDto {
    boothId: number;
    boothName: string;
    adminName: string;
    company: string;
}

interface BoothSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: number;
    alreadyMappedBoothIds: number[];
    onSelect: (booth: BoothSearchResDto) => void;
    onDeleteArea?: () => void;
}

export function BoothSearchModal({
                                     isOpen,
                                     onClose,
                                     eventId,
                                     alreadyMappedBoothIds,
                                     onSelect,
                                     onDeleteArea,
                                 }: BoothSearchModalProps) {
    const [keyword, setKeyword] = useState("");
    const [booths, setBooths] = useState<BoothSearchResDto[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const fetchBooths = React.useCallback(async (searchKeyword = "") => {
        try {
            setLoading(true);
            const params = searchKeyword ? {keyword: searchKeyword} : {};
            const res = await api.get(`/v1/booths/events/${eventId}/search`, {params});

            if (res.data.success) {
                // 이미 다른 영역에 매핑된 부스 제외
                const filtered = res.data.data.filter(
                    (b: BoothSearchResDto) => !alreadyMappedBoothIds.includes(b.boothId)
                );
                setBooths(filtered);
            }
        } catch (err) {
            console.error("Failed to fetch booths", err);
        } finally {
            setLoading(false);
        }
    }, [eventId, alreadyMappedBoothIds]);

    useEffect(() => {
        if (isOpen) {
            fetchBooths();
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setKeyword("");
            setBooths([]);
        }
    }, [isOpen, fetchBooths]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchBooths(keyword);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity">
            <div
                className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
                {/* Header */}
                <div
                    className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        부스 매핑
                    </h2>
                    <div className="flex items-center gap-2">
                        {onDeleteArea && (
                            <button
                                onClick={onDeleteArea}
                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                            >
                                <Trash2 className="w-4 h-4"/>
                                영역 삭제
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        >
                            <X className="w-6 h-6"/>
                        </button>
                    </div>
                </div>

                {/* Search Input */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="부스 이름, 관리자, 소속 검색..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border-none rounded-xl text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                        <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"/>
                    </form>
                </div>

                {/* Booth List */}
                <div className="overflow-y-auto flex-1 p-2">
                    {loading && (
                        <div className="flex justify-center items-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    )}

                    {!loading && booths.length === 0 && (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                            {keyword ? "검색 결과가 없습니다." : "매핑 가능한 부스가 없습니다."}
                        </div>
                    )}

                    {!loading && booths.length > 0 && (
                        <ul className="space-y-2">
                            {booths.map((booth) => (
                                <li key={booth.boothId}>
                                    <button
                                        onClick={() => onSelect(booth)}
                                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors flex flex-col gap-1 border border-transparent hover:border-blue-100 dark:hover:border-gray-600"
                                    >
                    <span className="font-semibold text-gray-800 dark:text-white">
                      {booth.boothName}
                    </span>
                                        {(booth.company || booth.adminName) && (
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                        {booth.company} {booth.company && booth.adminName ? "|" : ""}{" "}
                                                {booth.adminName}
                      </span>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

"use client";

import React, {useState, useEffect, useRef, useCallback} from "react";
import {X, Search, Trash2, Check} from "lucide-react";
import {api} from "@/lib/api/axios";

interface BoothInfo {
    boothId: number;
    boothName: string;
    locationCode: string;
    adminName: string;
    company: string;
    contact?: string; // We'll use email as contact if available
}

interface BoothSearchModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly eventId: number;
    readonly alreadyMappedBoothIds: number[];
    readonly currentBoothId?: number | null;
    readonly currentData?: {
        boothName?: string;
        locationCode?: string;
        adminName?: string;
        contact?: string;
        color?: string;
    };
    readonly onSelect: (data: {
        boothId: number | null;
        boothName: string;
        locationCode: string;
        adminName: string;
        contact: string;
        color: string;
    }) => void;
    readonly onDeleteArea?: () => void;
}

export function BoothSearchModal({
                                     isOpen,
                                     onClose,
                                     eventId,
                                     alreadyMappedBoothIds,
                                     currentBoothId,
                                     currentData,
                                     onSelect,
                                     onDeleteArea,
                                 }: BoothSearchModalProps) {
    const [allBooths, setAllBooths] = useState<BoothInfo[]>([]);
    const [filteredBooths, setFilteredBooths] = useState<BoothInfo[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [formData, setFormData] = useState({
        boothId: currentBoothId || null,
        boothName: currentData?.boothName || "",
        locationCode: currentData?.locationCode || "",
        adminName: currentData?.adminName || "",
        contact: currentData?.contact || "",
        color: currentData?.color || "#3B82F6", // Default blue
    });

    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchAllData = useCallback(async () => {
        try {
            // Fetch booth list and admin list to merge them
            const [adminsRes, detailsRes] = await Promise.all([
                api.get(`/api/v1/auth/booth-admins/events/${eventId}`),
                api.get(`/api/v1/booths/events/${eventId}`)
            ]);

            if (detailsRes.data.success && adminsRes.data.success) {
                const details = detailsRes.data.data;
                const admins = adminsRes.data.data;

                interface BoothDetail {
                    boothId: number;
                    name: string;
                    locationCode: string;
                }

                interface AdminDetail {
                    boothId: number;
                    name: string;
                    company: string;
                    email: string;
                }

                const merged: BoothInfo[] = details.map((d: BoothDetail) => {
                    const admin = admins.find((a: AdminDetail) => a.boothId === d.boothId);
                    return {
                        boothId: d.boothId,
                        boothName: d.name || "",
                        locationCode: d.locationCode || "",
                        adminName: admin?.name || "",
                        company: admin?.company || "",
                        contact: admin?.email || "",
                    };
                });

                setAllBooths(merged);
            }
        } catch (err) {
            console.error("Failed to fetch booth data", err);
        }
    }, [eventId]);
    useEffect(() => {
        if (isOpen) {
            fetchAllData();

            const newBoothId = currentBoothId || null;
            const newBoothName = currentData?.boothName || "";
            const newLocationCode = currentData?.locationCode || "";
            const newAdminName = currentData?.adminName || "";
            const newContact = currentData?.contact || "";
            const newColor = currentData?.color || "#3B82F6";

            if (
                formData.boothId !== newBoothId ||
                formData.boothName !== newBoothName ||
                formData.locationCode !== newLocationCode ||
                formData.adminName !== newAdminName ||
                formData.contact !== newContact ||
                formData.color !== newColor
            ) {
                setFormData({
                    boothId: newBoothId,
                    boothName: newBoothName,
                    locationCode: newLocationCode,
                    adminName: newAdminName,
                    contact: newContact,
                    color: newColor,
                });
            }
        }
    }, [isOpen, fetchAllData, currentBoothId, currentData, formData]);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleBoothNameChange = (val: string) => {
        setFormData(prev => ({...prev, boothName: val, boothId: null}));

        if (val.trim() === "") {
            setFilteredBooths(allBooths.filter(b => !alreadyMappedBoothIds.includes(b.boothId) || b.boothId === currentBoothId));
        } else {
            const filtered = allBooths.filter(b =>
                (b.boothName?.toLowerCase().includes(val.toLowerCase()) ||
                    b.company?.toLowerCase().includes(val.toLowerCase())) &&
                (!alreadyMappedBoothIds.includes(b.boothId) || b.boothId === currentBoothId)
            );
            setFilteredBooths(filtered);
        }
        setIsDropdownOpen(true);
    };

    const handleSelectFromList = (booth: BoothInfo) => {
        setFormData({
            boothId: booth.boothId,
            boothName: booth.boothName,
            locationCode: booth.locationCode,
            adminName: booth.adminName,
            contact: booth.contact || "",
            color: formData.color, // Keep current color
        });
        setIsDropdownOpen(false);
    };

    const handleRegister = () => {
        onSelect({
            ...formData,
            boothId: formData.boothId
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all p-4">
            <div
                className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div
                    className="flex justify-between items-center px-8 py-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                        부스 설정
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500"/>
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Row 1: 업체명, 위치 코드, 색상 */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                        <div className="md:col-span-6 relative" ref={dropdownRef}>
                            <label htmlFor="boothName"
                                   className="block text-sm font-black text-gray-500 mb-2 ml-1">업체명</label>
                            <div className="relative">
                                <input
                                    id="boothName"
                                    type="text"
                                    placeholder="업체명을 검색하거나 입력하세요"
                                    value={formData.boothName}
                                    onFocus={() => {
                                        setFilteredBooths(allBooths.filter(b => !alreadyMappedBoothIds.includes(b.boothId) || b.boothId === currentBoothId));
                                        setIsDropdownOpen(true);
                                    }}
                                    onChange={(e) => handleBoothNameChange(e.target.value)}
                                    className="w-full px-5 py-4 bg-gray-100 dark:bg-gray-700 border-none rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                                <Search className="absolute right-4 top-4.5 w-5 h-5 text-gray-400"/>
                            </div>

                            {/* Autocomplete Dropdown */}
                            {isDropdownOpen && filteredBooths.length > 0 && (
                                <div
                                    className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-2xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
                                    {filteredBooths.map((booth) => (
                                        <button
                                            key={booth.boothId}
                                            onClick={() => handleSelectFromList(booth)}
                                            className="w-full text-left px-5 py-4 hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors flex flex-col border-b border-gray-50 dark:border-gray-600 last:border-none"
                                        >
                                            <span
                                                className="font-bold text-gray-900 dark:text-white">{booth.boothName}</span>
                                            <span
                                                className="text-xs text-gray-400 mt-0.5">{booth.company} | {booth.locationCode}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-4">
                            <label htmlFor="locationCode" className="block text-sm font-black text-gray-500 mb-2 ml-1">위치
                                코드</label>
                            <input
                                id="locationCode"
                                type="text"
                                placeholder="위치 코드"
                                value={formData.locationCode}
                                onChange={(e) => setFormData(prev => ({...prev, locationCode: e.target.value}))}
                                className="w-full px-5 py-4 bg-gray-100 dark:bg-gray-700 border-none rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="color"
                                   className="block text-sm font-black text-gray-500 mb-2 ml-1 text-center">영역
                                색상</label>
                            <div
                                className="flex items-center justify-center h-[56px] bg-gray-100 dark:bg-gray-700 rounded-2xl p-2">
                                <input
                                    id="color"
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData(prev => ({...prev, color: e.target.value}))}
                                    className="w-full h-full cursor-pointer bg-transparent border-none p-0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Row 2: 담당자 이름, 연락처 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="adminName" className="block text-sm font-black text-gray-500 mb-2 ml-1">담당자
                                이름</label>
                            <input
                                id="adminName"
                                type="text"
                                placeholder="담당자 이름"
                                value={formData.adminName}
                                onChange={(e) => setFormData(prev => ({...prev, adminName: e.target.value}))}
                                className="w-full px-5 py-4 bg-gray-100 dark:bg-gray-700 border-none rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label htmlFor="contact" className="block text-sm font-black text-gray-500 mb-2 ml-1">연락처
                                (이메일)</label>
                            <input
                                id="contact"
                                type="text"
                                placeholder="연락처 또는 이메일"
                                value={formData.contact}
                                onChange={(e) => setFormData(prev => ({...prev, contact: e.target.value}))}
                                className="w-full px-5 py-4 bg-gray-100 dark:bg-gray-700 border-none rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Row 3: 버튼들 */}
                    <div className="flex gap-4 pt-4">
                        {onDeleteArea && (
                            <button
                                onClick={onDeleteArea}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-50 text-red-500 rounded-2xl font-black text-lg hover:bg-red-100 transition-all active:scale-95"
                            >
                                <Trash2 className="w-5 h-5"/>
                                영역 삭제
                            </button>
                        )}
                        <button
                            onClick={handleRegister}
                            className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-[#2D2A4A] text-white rounded-2xl font-black text-lg hover:bg-[#1a1836] shadow-lg hover:scale-[1.02] transition-all active:scale-95"
                        >
                            <Check className="w-6 h-6"/>
                            등록하기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

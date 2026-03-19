"use client";

import React, { useState, useEffect } from "react";
import DaumPostcode from "react-daum-postcode";
import { api } from "@/lib/api";

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any | null; // The event object to edit
}

export function EditEventModal({ isOpen, onClose, event }: EditEventModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    status: "OPEN",
    startDate: "",
    endDate: "",
    openTime: "",
    closeTime: "",
    locationAddress: "",
    thumbnailImageUrl: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);

  // Load event data when modal opens
  useEffect(() => {
    if (isOpen && event) {
      setFormData({
        name: event.name || "",
        status: event.status || "OPEN",
        startDate: event.startDate || "",
        endDate: event.endDate || "",
        openTime: event.openTime || "",
        closeTime: event.closeTime || "",
        locationAddress: event.locationAddress || "",
        thumbnailImageUrl: event.thumbnailImageUrl || "",
      });
    }
  }, [isOpen, event]);

  const handleComplete = (data: any) => {
    let fullAddress = data.address;
    let extraAddress = "";

    if (data.addressType === "R") {
      if (data.bname !== "") {
        extraAddress += data.bname;
      }
      if (data.buildingName !== "") {
        extraAddress += extraAddress !== "" ? `, ${data.buildingName}` : data.buildingName;
      }
      fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
    }

    setFormData((prev) => ({ ...prev, locationAddress: fullAddress }));
    setIsPostcodeOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Form Validation
  const isFormValid =
    formData.name.trim() !== "" &&
    formData.status.trim() !== "" &&
    formData.startDate !== "" &&
    formData.endDate !== "" &&
    formData.openTime !== "" &&
    formData.closeTime !== "" &&
    formData.locationAddress.trim() !== "";

  const handleSubmit = async () => {
    if (!isFormValid || isLoading || !event) return;

    try {
      setIsLoading(true);

      const payload = {
        name: formData.name,
        status: formData.status,
        startDate: formData.startDate,
        endDate: formData.endDate,
        openTime: formData.openTime.length === 5 ? `${formData.openTime}:00` : formData.openTime, // Ensure HH:mm:ss format natively if needed
        closeTime: formData.closeTime.length === 5 ? `${formData.closeTime}:00` : formData.closeTime,
        locationAddress: formData.locationAddress,
        thumbnailImageUrl: formData.thumbnailImageUrl || "https://example.com/images/default.png", // fallback URL if empty
      };

      // Use event ID from the passed event object, defaulting to 1 for dummy testing if undefined
      const eventId = event.id || 1;
      await api.patch(`/api/v1/events/${eventId}`, payload);

      alert("행사 정보가 성공적으로 수정되었습니다.");
      onClose();
      // TODO: refresh parent component list
    } catch (error) {
      console.error("행사 수정 중 오류 발생:", error);
      alert("행사 수정에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-[#F8F9FA] rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-8 py-6 flex justify-between items-center bg-white sticky top-0 z-10 rounded-t-[32px] shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">행사 정보 및 상태 수정</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <div className="px-8 py-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-6">

            {/* 행사명 */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[15px] font-bold text-gray-900">행사 이름</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="행사 이름을 입력해주세요"
                className="w-full bg-[#F3F4F6] border-none rounded-2xl p-4 text-[15px] text-gray-900 focus:ring-2 focus:ring-[#2D2A4A] focus:bg-white transition-all outline-none"
              />
            </div>

            {/* 행사 상태 */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[15px] font-bold text-gray-900">행사 상태</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-[#F3F4F6] border-none rounded-2xl p-4 text-[15px] text-gray-900 focus:ring-2 focus:ring-[#2D2A4A] focus:bg-white transition-all outline-none appearance-none"
              >
                <option value="UPCOMING">행사 준비 중</option>
                <option value="OPEN">행사 진행 중</option>
                <option value="CLOSED">행사 종료</option>
              </select>
            </div>

            {/* 일시 */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[15px] font-bold text-gray-900">행사 일시</label>
              <div className="flex items-center gap-3 bg-[#F3F4F6] p-2 rounded-2xl focus-within:ring-2 focus-within:ring-[#2D2A4A] focus-within:bg-white transition-all">
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="flex-1 bg-transparent border-none p-2 text-[15px] text-gray-900 outline-none"
                />
                <span className="text-gray-400 font-bold">-</span>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="flex-1 bg-transparent border-none p-2 text-[15px] text-gray-900 outline-none"
                />
              </div>
            </div>

            {/* 시간 */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[15px] font-bold text-gray-900">운영 시간</label>
              <div className="flex items-center gap-3 bg-[#F3F4F6] p-2 rounded-2xl focus-within:ring-2 focus-within:ring-[#2D2A4A] focus-within:bg-white transition-all">
                <input
                  type="time"
                  name="openTime"
                  value={formData.openTime}
                  onChange={handleChange}
                  className="flex-1 bg-transparent border-none p-2 text-[15px] text-gray-900 outline-none"
                />
                <span className="text-gray-400 font-bold">-</span>
                <input
                  type="time"
                  name="closeTime"
                  value={formData.closeTime}
                  onChange={handleChange}
                  className="flex-1 bg-transparent border-none p-2 text-[15px] text-gray-900 outline-none"
                />
              </div>
            </div>

            {/* 주소 */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[15px] font-bold text-gray-900">행사 주소</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="locationAddress"
                  value={formData.locationAddress}
                  onChange={handleChange}
                  placeholder="상세 주소를 입력하거나 검색을 이용하세요"
                  className="flex-1 w-full bg-[#F3F4F6] border-none rounded-2xl p-4 text-[15px] text-gray-900 focus:ring-2 focus:ring-[#2D2A4A] focus:bg-white transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setIsPostcodeOpen(true)}
                  className="bg-[#2D2A4A] text-white font-bold px-5 rounded-2xl text-[14px] hover:bg-[#1f1d33] transition-colors whitespace-nowrap shadow-sm"
                >
                  주소 검색
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 shrink-0 mt-auto bg-white rounded-b-[32px]">
          <button
            disabled={!isFormValid || isLoading}
            onClick={handleSubmit}
            className={`w-full font-bold py-4 rounded-xl text-[16px] transition-colors shadow-lg flex items-center justify-center gap-2 ${isFormValid && !isLoading
              ? "bg-[#2D2A4A] text-white hover:bg-[#1f1d33] shadow-[#2D2A4A]/20"
              : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                처리 중...
              </>
            ) : "수정하기"}
          </button>
        </div>
      </div>

      {/* Daum Postcode Modal */}
      {isPostcodeOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setIsPostcodeOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">도로명 주소 검색</h3>
              <button
                onClick={() => setIsPostcodeOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <DaumPostcode
              onComplete={handleComplete}
              style={{ height: '450px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

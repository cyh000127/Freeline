"use client";

import React, { useEffect, useState } from "react";
import DaumPostcode from "react-daum-postcode";
import { api } from "@/lib/api";
import { eventApi } from "@/lib/api/event";
import {
  EVENT_FORM_LIMITS,
  getEventInputClassName,
  getTodayDateString,
  parsePolicyValue,
} from "@/lib/event-form";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const createInitialFormData = () => ({
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  openTime: "",
  closeTime: "",
  locationAddress: "",
  thumbnailImageUrl: "",
  default_stay_sec: 600,
  default_max_waiting: 30,
  default_call_count: 5,
  default_call_ttl: 300,
  default_defer_limit: 2,
});

export function AddEventModal({ isOpen, onClose }: AddEventModalProps) {
  const [formData, setFormData] = useState(createInitialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const resetModalState = () => {
    setFormData(createInitialFormData());
    setIsLoading(false);
    setIsPostcodeOpen(false);
    setThumbnailFile(null);
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      resetModalState();
    }
  }, [isOpen]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: parsePolicyValue(value) }));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, thumbnailImageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const nameLength = formData.name.length;
  const descriptionLength = formData.description.length;
  const locationAddressLength = formData.locationAddress.length;
  const today = getTodayDateString();
  const hasNameLengthError = nameLength > EVENT_FORM_LIMITS.name;
  const hasDescriptionLengthError = descriptionLength > EVENT_FORM_LIMITS.description;
  const hasLocationAddressLengthError = locationAddressLength > EVENT_FORM_LIMITS.locationAddress;
  const hasStartDateError = formData.startDate !== "" && formData.startDate < today;
  const hasEndDateError =
    formData.endDate !== "" &&
    formData.startDate !== "" &&
    formData.endDate < formData.startDate;
  const hasInputLengthError = hasNameLengthError || hasDescriptionLengthError || hasLocationAddressLengthError;
  const hasDateError = hasStartDateError || hasEndDateError;

  const isFormValid =
    formData.name.trim() !== "" &&
    formData.description.trim() !== "" &&
    formData.startDate !== "" &&
    formData.endDate !== "" &&
    formData.openTime !== "" &&
    formData.closeTime !== "" &&
    formData.locationAddress.trim() !== "" &&
    formData.default_stay_sec > 0 &&
    formData.default_max_waiting > 0 &&
    formData.default_call_count > 0 &&
    formData.default_call_ttl > 0 &&
    formData.default_defer_limit > 0 &&
    !hasInputLengthError &&
    !hasDateError;

  const handleSubmit = async () => {
    if (!isFormValid || isLoading) return;

    try {
      setIsLoading(true);

      // 1. 행사 생성 API 호출
      const eventPayload = {
        name: formData.name,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        openTime: formData.openTime.length === 5 ? `${formData.openTime}:00` : formData.openTime,
        closeTime: formData.closeTime.length === 5 ? `${formData.closeTime}:00` : formData.closeTime,
        locationAddress: formData.locationAddress,
        // thumbnailImageUrl은 별도 /thumbnail API로 업로드하므로 여기서 제외
      };

      const eventResponse = await api.post("/v1/events", eventPayload);

      // 서버 응답에서 생성된 이벤트 ID 추출 (래퍼 유무 대응)
      const resData = eventResponse.data;
      const eventId = resData?.data?.eventId || resData?.data?.id || resData?.eventId || resData?.id;

      if (eventId) {
        // 2. 행사 정책 설정 API 호출
        const policyPayload = {
          default_stay_sec: formData.default_stay_sec,
          default_max_waiting: formData.default_max_waiting,
          default_call_count: formData.default_call_count,
          default_call_ttl: formData.default_call_ttl,
          default_defer_limit: formData.default_defer_limit
        };
        await api.put(`/v1/events/${eventId}/policies`, policyPayload);

        // 3. 썸네일 업로드 (파일이 있을 경우에만)
        if (thumbnailFile) {
          try {
            await eventApi.uploadThumbnail(eventId, thumbnailFile);
          } catch (thumbErr) {
            console.warn("썸네일 업로드 실패 (행사는 생성됨):", thumbErr);
          }
        }
      }

      alert("행사가 성공적으로 추가되었습니다.");
      handleClose();
      // 추가적으로 부모 컴포넌트(리스트)에 새로고침 요청을 보낼 수 있습니다.
    } catch (error: any) {
      console.error("행사 생성 중 오류 발생:", error);
      const serverData = error.response?.data;
      const errorMessage = serverData?.error?.message || serverData?.message || serverData?.error || "행사 생성에 실패했습니다.";
      
      if (error.response?.status === 409) {
        const detail = typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage;
        alert(`중복된 행사가 존재하거나 생성할 수 없습니다: ${detail}`);
      } else {
        const detail = typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage;
        alert(`오류가 발생했습니다: ${detail}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-[24px] w-full max-w-[640px] max-h-[90vh] flex flex-col shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4 shrink-0">
          <div className="w-8" /> {/* Spacer for flex centering */}
          <h2 className="text-[22px] font-bold text-gray-900 mx-auto">행사 추가</h2>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="px-8 py-2 overflow-y-auto flex flex-col gap-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">

          {/* 행사 이름 */}
          <div className="flex flex-col gap-2.5">
            <label className="text-[15px] font-bold text-gray-900">행사 이름</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={getEventInputClassName(hasNameLengthError)}
            />
            <div className="flex items-center justify-between px-1">
              <p className={`text-[13px] ${hasNameLengthError ? "font-semibold text-red-500" : "text-gray-400"}`}>
                {hasNameLengthError ? `행사 이름은 ${EVENT_FORM_LIMITS.name}자 이하여야 합니다.` : " "}
              </p>
              <span className={`text-[12px] ${hasNameLengthError ? "font-semibold text-red-500" : "text-gray-400"}`}>
                {nameLength}/{EVENT_FORM_LIMITS.name}
              </span>
            </div>
          </div>

          {/* 행사 설명 */}
          <div className="flex flex-col gap-2.5">
            <label className="text-[15px] font-bold text-gray-900">행사 설명</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="행사 설명을 입력해주세요"
              rows={3}
              className={getEventInputClassName(hasDescriptionLengthError, "placeholder-gray-400 resize-none")}
            />
            <div className="flex items-center justify-between px-1">
              <p className={`text-[13px] ${hasDescriptionLengthError ? "font-semibold text-red-500" : "text-gray-400"}`}>
                {hasDescriptionLengthError ? `행사 설명은 ${EVENT_FORM_LIMITS.description}자 이하여야 합니다.` : " "}
              </p>
              <span className={`text-[12px] ${hasDescriptionLengthError ? "font-semibold text-red-500" : "text-gray-400"}`}>
                {descriptionLength}/{EVENT_FORM_LIMITS.description}
              </span>
            </div>
          </div>

          {/* 시작 날짜 / 종료 날짜 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2.5">
              <label className="text-[15px] font-bold text-gray-900">시작 날짜</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </div>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={today}
                  className={getEventInputClassName(hasStartDateError, "pl-12 cursor-pointer")}
                />
              </div>
              <p className={`min-h-5 px-1 text-[13px] ${hasStartDateError ? "font-semibold text-red-500" : "text-gray-400"}`}>
                {hasStartDateError ? "시작 날짜는 오늘 이전으로 설정할 수 없습니다." : " "}
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-[15px] font-bold text-gray-900">종료 날짜</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </div>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate && formData.startDate >= today ? formData.startDate : today}
                  className={getEventInputClassName(hasEndDateError, "pl-12 cursor-pointer")}
                />
              </div>
              <p className={`min-h-5 px-1 text-[13px] ${hasEndDateError ? "font-semibold text-red-500" : "text-gray-400"}`}>
                {hasEndDateError ? "종료 날짜는 시작 날짜보다 빠를 수 없습니다." : " "}
              </p>
            </div>
          </div>

          {/* 오픈 시간 / 마감 시간 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2.5">
              <label className="text-[15px] font-bold text-gray-900">오픈 시간</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <input
                  type="time"
                  name="openTime"
                  value={formData.openTime}
                  onChange={handleChange}
                  className="w-full bg-[#F3F4F6] border-none rounded-2xl p-4 pl-12 text-[15px] text-gray-900 focus:ring-2 focus:ring-[#2D2A4A] focus:bg-white transition-all outline-none cursor-pointer"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-[15px] font-bold text-gray-900">마감 시간</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <input
                  type="time"
                  name="closeTime"
                  value={formData.closeTime}
                  onChange={handleChange}
                  className="w-full bg-[#F3F4F6] border-none rounded-2xl p-4 pl-12 text-[15px] text-gray-900 focus:ring-2 focus:ring-[#2D2A4A] focus:bg-white transition-all outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 행사 주소 */}
          <div className="flex flex-col gap-2.5">
            <label className="text-[15px] font-bold text-gray-900">행사 주소</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="locationAddress"
                value={formData.locationAddress}
                onChange={handleChange}
                placeholder="상세 주소를 입력하거나 검색을 이용하세요"
                className={`flex-1 ${getEventInputClassName(hasLocationAddressLengthError)}`}
              />
              <button
                type="button"
                onClick={() => setIsPostcodeOpen(true)}
                className="bg-[#2D2A4A] text-white font-bold px-5 rounded-2xl text-[14px] hover:bg-[#1f1d33] transition-colors whitespace-nowrap shadow-sm"
              >
                주소 검색
              </button>
            </div>
            <div className="flex items-center justify-between px-1">
              <p className={`text-[13px] ${hasLocationAddressLengthError ? "font-semibold text-red-500" : "text-gray-400"}`}>
                {hasLocationAddressLengthError ? `행사 주소는 ${EVENT_FORM_LIMITS.locationAddress}자 이하여야 합니다.` : " "}
              </p>
              <span className={`text-[12px] ${hasLocationAddressLengthError ? "font-semibold text-red-500" : "text-gray-400"}`}>
                {locationAddressLength}/{EVENT_FORM_LIMITS.locationAddress}
              </span>
            </div>
          </div>

          <div className="h-px bg-gray-100 my-2" />

          {/* 행사 정책 기본 설정 */}
          <div className="flex flex-col gap-3">
            <h3 className="text-[15px] font-bold text-gray-900">행사 정책 기본 설정</h3>
            <p className="text-[13px] text-gray-500 mb-1">웨이팅, 호출 등에 대한 기본 정책의 디폴트 값입니다. 필요시 수정할 수 있습니다.</p>
            <p className="text-[12px] text-gray-400 -mt-2">모든 정책 값은 숫자만 입력 가능하며 최대 {EVENT_FORM_LIMITS.policyMax}까지 설정할 수 있습니다.</p>

            <div className="grid grid-cols-2 gap-3 bg-[#F8F9FA] p-5 rounded-2xl border border-gray-100">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-gray-700">기본 체류 시간 (초)</label>
                <div className="relative">
                  <input
                    type="text"
                    name="default_stay_sec"
                    value={formData.default_stay_sec}
                    onChange={handleNumberChange}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={5}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 pr-10 text-[14px] text-gray-900 focus:ring-2 focus:ring-[#2D2A4A] focus:border-transparent outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-400 pointer-events-none">sec</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-gray-700">기본 최대 대기 인원</label>
                <div className="relative">
                  <input
                    type="text"
                    name="default_max_waiting"
                    value={formData.default_max_waiting}
                    onChange={handleNumberChange}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={5}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 pr-10 text-[14px] text-gray-900 focus:ring-2 focus:ring-[#2D2A4A] focus:border-transparent outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-400 pointer-events-none">명</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-gray-700">기본 호출 횟수</label>
                <div className="relative">
                  <input
                    type="text"
                    name="default_call_count"
                    value={formData.default_call_count}
                    onChange={handleNumberChange}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={5}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 pr-10 text-[14px] text-gray-900 focus:ring-2 focus:ring-[#2D2A4A] focus:border-transparent outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-400 pointer-events-none">회</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-gray-700">기본 호출 수명 (초)</label>
                <div className="relative">
                  <input
                    type="text"
                    name="default_call_ttl"
                    value={formData.default_call_ttl}
                    onChange={handleNumberChange}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={5}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 pr-10 text-[14px] text-gray-900 focus:ring-2 focus:ring-[#2D2A4A] focus:border-transparent outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-400 pointer-events-none">sec</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-[13px] font-bold text-gray-700">기본 미루기 제한</label>
                <div className="relative">
                  <input
                    type="text"
                    name="default_defer_limit"
                    value={formData.default_defer_limit}
                    onChange={handleNumberChange}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={5}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 pr-10 text-[14px] text-gray-900 focus:ring-2 focus:ring-[#2D2A4A] focus:border-transparent outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-400 pointer-events-none">회</span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 my-2" />

          {/* 행사 포스터 업로드 */}
          <div className="flex flex-col gap-4 pb-4">
            <label className="text-[15px] font-bold text-gray-900">행사 포스터 업로드</label>
            
            <div className="flex items-center gap-6">
              {/* 이미지 미리보기 */}
              <div className="w-32 h-32 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                {formData.thumbnailImageUrl ? (
                  <img src={formData.thumbnailImageUrl} alt="Poster preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[12px] text-gray-400 font-medium">사진 없음</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  id="thumbnail-upload"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />
                <label
                  htmlFor="thumbnail-upload"
                  className="w-fit flex items-center justify-center gap-2 bg-white border-2 border-[#2D2A4A] text-[#2D2A4A] font-bold py-2.5 px-6 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  사진 선택
                </label>
                <div className="text-[13px] text-gray-400 mt-1 space-y-0.5 leading-relaxed">
                  <p>•  jpeg, jpg, png만 가능</p>
                  <p>•  파일 10MB 이하 업로드 가능</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="px-8 py-6 shrink-0 mt-auto bg-white rounded-b-[24px]">
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
            ) : "추가하기"}
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

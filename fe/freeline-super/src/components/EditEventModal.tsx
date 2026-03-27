"use client";

import React, { useState, useEffect, useRef } from "react";
import DaumPostcode from "react-daum-postcode";
import { api } from "@/lib/api";
import { eventApi } from "@/lib/api/event";
import { useModal } from "@/context/ModalContext";
import {
  EVENT_FORM_LIMITS,
  getEventInputClassName,
  getTodayDateString,
  parsePolicyValue,
} from "@/lib/event-form";

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any | null; // The event object to edit
}

const createInitialFormData = () => ({
  name: "",
  description: "",
  status: "DRAFT",
  startDate: "",
  endDate: "",
  openTime: "",
  closeTime: "",
  locationAddress: "",
  thumbnailImageUrl: "",
});

const createInitialPolicyData = () => ({
  default_stay_sec: 600,
  default_max_waiting: 30,
  default_call_count: 5,
  default_call_ttl: 300,
  default_defer_limit: 2,
});

const createFormDataFromEvent = (event: any | null) => ({
  name: event?.name || "",
  description: event?.description || "",
  status: event?.status || "DRAFT",
  startDate: event?.startDate || "",
  endDate: event?.endDate || "",
  openTime: event?.openTime || "",
  closeTime: event?.closeTime || "",
  locationAddress: event?.locationAddress || "",
  thumbnailImageUrl: event?.thumbnailImageUrl || "",
});

export function EditEventModal({ isOpen, onClose, event }: EditEventModalProps) {
  const [formData, setFormData] = useState(createInitialFormData);
  const { showAlert } = useModal();
  const [policyData, setPolicyData] = useState(createInitialPolicyData);

  const [isLoading, setIsLoading] = useState(false);
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  const resetModalState = () => {
    setFormData(createInitialFormData());
    setPolicyData(createInitialPolicyData());
    setIsLoading(false);
    setIsPostcodeOpen(false);
    setThumbnailFile(null);
    setIsStatusOpen(false);
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  // 상태 레이블 매핑
  const STATUS_LABELS: Record<string, string> = {
    DRAFT: "임시저장",
    READY: "행사 준비 중",
    OPEN: "행사 진행 중",
    CLOSED: "행사 종료",
    CANCELED: "행사 취소",
  };

  // 상태 색상 매핑
  const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    DRAFT: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
    READY: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    OPEN: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
    CLOSED: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
    CANCELED: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  };

  // 현재 상태에서 전환 가능한 상태 목록
  const getAllowedStatuses = (current: string): string[] => {
    switch (current) {
      case "DRAFT":    return ["DRAFT", "READY"];
      case "READY":    return ["READY", "OPEN", "DRAFT"];
      case "OPEN":     return ["OPEN", "CLOSED"];
      case "CLOSED":   return ["CLOSED", "CANCELED"];
      case "CANCELED": return ["CANCELED"];
      default:         return ["DRAFT"];
    }
  };

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setIsStatusOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load event data when modal opens
  useEffect(() => {
    if (!isOpen) {
      resetModalState();
      return;
    }

    setFormData(createFormDataFromEvent(event));
    setPolicyData(createInitialPolicyData());
    setThumbnailFile(null);
    setIsPostcodeOpen(false);
    setIsStatusOpen(false);

    let cancelled = false;

    const fetchEventDetail = async () => {
      if (!isOpen || !event) return;

      const eventId = event.eventId || event.id;
      if (!eventId) return;

      try {
        setIsLoading(true);
        // 상세 조회 API 호출
        const response = await eventApi.getEvent(eventId);
        let detail = null;
        // 1. 래퍼가 있는 경우
        if (response.data?.success && response.data?.data) {
          detail = response.data.data;
        } 
        // 2. 래퍼가 없는 경우
        else if (response.data && (response.data as any).eventId) {
          detail = response.data;
        }

        if (detail) {
          const d = detail as any;
          if (!cancelled) {
            setFormData(createFormDataFromEvent(d));
          }
        }

        // 행사 정책 조회
        try {
          const policyRes = await eventApi.getPolicy(eventId);
          const p = policyRes.data?.data || policyRes.data;
          if (!cancelled && p) {
            setPolicyData({
              default_stay_sec: p.default_stay_sec ?? 600,
              default_max_waiting: p.default_max_waiting ?? 30,
              default_call_count: p.default_call_count ?? 5,
              default_call_ttl: p.default_call_ttl ?? 300,
              default_defer_limit: p.default_defer_limit ?? 2,
            });
          }
        } catch (pErr) {
          console.warn("정책 조회 실패 (기본값 사용):", pErr);
        }
      } catch (error) {
        console.error("Failed to fetch event detail:", error);
        // 상세 조회 실패 시 목록에서 받은 데이터라도 최소한으로 채움
        if (!cancelled) {
          setFormData(createFormDataFromEvent(event));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchEventDetail();

    return () => {
      cancelled = true;
    };
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
  const hasStartDateError =
    formData.startDate !== "" && formData.startDate < today;
  const hasEndDateError =
    formData.endDate !== "" &&
    ((formData.startDate !== "" && formData.endDate < formData.startDate) || formData.endDate < today);
  const hasInputLengthError = hasNameLengthError || hasDescriptionLengthError || hasLocationAddressLengthError;
  const hasDateError = hasStartDateError || hasEndDateError;

  // Form Validation
  const isFormValid =
    formData.name.trim() !== "" &&
    formData.description.trim() !== "" &&
    formData.status.trim() !== "" &&
    formData.startDate !== "" &&
    formData.endDate !== "" &&
    formData.openTime !== "" &&
    formData.closeTime !== "" &&
    formData.locationAddress.trim() !== "" &&
    !hasInputLengthError &&
    !hasDateError;

  const handleSubmit = async () => {
    if (!isFormValid || isLoading || !event) return;

    try {
      setIsLoading(true);

      const payload = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        startDate: formData.startDate,
        endDate: formData.endDate,
        openTime: formData.openTime.length === 5 ? `${formData.openTime}:00` : formData.openTime,
        closeTime: formData.closeTime.length === 5 ? `${formData.closeTime}:00` : formData.closeTime,
        locationAddress: formData.locationAddress,
        // thumbnailImageUrl은 별도 /thumbnail API로 업로드하므로 여기서 제외
      };

      const eventId = event.eventId || event.id || 1;
      await api.patch(`/v1/events/${eventId}`, payload);

      // 썸네일 파일이 새로 선택된 경우 업로드
      if (thumbnailFile) {
        try {
          await eventApi.uploadThumbnail(eventId, thumbnailFile);
        } catch (thumbErr: any) {
          const errorStatus = thumbErr.response?.data?.status || thumbErr.response?.data?.error?.status;
          if (errorStatus === "INVALID_IMAGE_FORMAT") {
            showAlert("지원하지 않는 이미지 포맷이거나 손상된 파일입니다.");
          } else {
            console.warn("썸네일 업로드 실패 (나머지 정보는 저장됨):", thumbErr);
          }
        }
      }

      // 행사 정책 수정
      try {
        await eventApi.updatePolicy(eventId, policyData);
      } catch (pErr) {
        console.warn("정책 수정 실패 (행사 정보는 저장됨):", pErr);
      }

      showAlert("행사 정보가 성공적으로 수정되었습니다.");
      handleClose();
    } catch (error: any) {
      console.error("행사 수정 중 오류 발생:", error);
      const serverData = error.response?.data;
      const errorMessage = serverData?.error?.message || serverData?.message || error.message || "행사 수정에 실패했습니다.";
      
      if (error.response?.status === 409) {
        const detail = typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage;
        showAlert(`수정된 내용이 기존 데이터와 충돌하거나 허용되지 않습니다: ${detail}`);
      } else {
        const detail = typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage;
        showAlert(`오류가 발생했습니다: ${detail}`);
      }
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
            onClick={handleClose}
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

            {/* 행사 상태 */}
            <div className="flex flex-col gap-2.5" ref={statusRef}>
              <label className="text-[15px] font-bold text-gray-900">행사 상태</label>
              <div className="relative">
                {/* 선택된 상태 표시 버튼 */}
                <button
                  type="button"
                  onClick={() => setIsStatusOpen((prev) => !prev)}
                  className="w-full bg-[#F3F4F6] rounded-2xl p-4 text-[15px] text-left flex items-center justify-between gap-3 hover:bg-gray-200 transition-all outline-none focus:ring-2 focus:ring-[#2D2A4A]"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_COLORS[formData.status]?.dot ?? "bg-gray-400"}`} />
                    <span className="font-semibold text-gray-900">{STATUS_LABELS[formData.status] ?? formData.status}</span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isStatusOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* 드롭다운 목록 */}
                {isStatusOpen && (
                  <div className="absolute top-full mt-2 left-0 w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20">
                    {Object.entries(STATUS_LABELS).map(([value, label]) => {
                      const allowed = getAllowedStatuses(formData.status);
                      const isAllowed = allowed.includes(value);
                      const isCurrent = formData.status === value;
                      const colors = STATUS_COLORS[value];
                      return (
                        <button
                          key={value}
                          type="button"
                          disabled={!isAllowed}
                          onClick={() => {
                            if (isAllowed) {
                              setFormData((prev) => ({ ...prev, status: value }));
                              setIsStatusOpen(false);
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-5 py-3.5 text-[14px] font-semibold transition-all
                            ${
                              !isAllowed
                                ? "opacity-30 cursor-not-allowed text-gray-400"
                                : isCurrent
                                ? `${colors.bg} ${colors.text}`
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.dot} ${!isAllowed ? "opacity-40" : ""}`} />
                          {label}
                          {isCurrent && (
                            <svg className="ml-auto w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {!isAllowed && (
                            <span className="ml-auto text-[11px] font-normal text-gray-400">전환 불가</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
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
                className={getEventInputClassName(hasDescriptionLengthError, "resize-none")}
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

            {/* 일시 */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[15px] font-bold text-gray-900">행사 일시</label>
              <div
                className={`flex items-center gap-3 p-2 rounded-2xl transition-all ${
                  hasDateError
                    ? "bg-[#FFF5F5] ring-1 ring-red-400 focus-within:ring-2 focus-within:ring-red-400"
                    : "bg-[#F3F4F6] focus-within:ring-2 focus-within:ring-[#2D2A4A] focus-within:bg-white"
                }`}
              >
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={today}
                  className="flex-1 bg-transparent border-none p-2 text-[15px] text-gray-900 outline-none"
                />
                <span className="text-gray-400 font-bold">-</span>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate || today}
                  className="flex-1 bg-transparent border-none p-2 text-[15px] text-gray-900 outline-none"
                />
              </div>
              <p className={`min-h-5 px-1 text-[13px] ${hasDateError ? "font-semibold text-red-500" : "text-gray-400"}`}>
                {hasStartDateError
                  ? "시작 날짜는 오늘 이전으로 설정할 수 없습니다."
                  : hasEndDateError
                  ? "종료 날짜는 오늘 이전이거나 시작 날짜보다 빠를 수 없습니다."
                  : " "}
              </p>
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

            {/* 구분선 */}
            <div className="h-px bg-gray-100" />

            {/* 행사 정책 */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[15px] font-bold text-gray-900">행사 정책 설정</h3>
              <p className="text-[13px] text-gray-500 -mt-1">웨이팅, 호출 등에 대한 기본 정책을 설정합니다.</p>
              <p className="text-[12px] text-gray-400 -mt-2">모든 정책 값은 숫자만 입력 가능하며 최대 {EVENT_FORM_LIMITS.policyMax}까지 설정할 수 있습니다.</p>

              <div className="grid grid-cols-2 gap-3 bg-[#F8F9FA] p-5 rounded-2xl border border-gray-100">
                {/* 기본 체류 시간 */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-gray-700">기본 체류 시간 (초)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={policyData.default_stay_sec}
                      onChange={(e) => setPolicyData((prev) => ({ ...prev, default_stay_sec: parsePolicyValue(e.target.value) }))}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={5}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 pr-10 text-[14px] text-gray-900 focus:ring-2 focus:ring-[#2D2A4A] focus:border-transparent outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-400 pointer-events-none">sec</span>
                  </div>
                </div>

                {/* 최대 대기 인원 */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-gray-700">최대 대기 인원</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={policyData.default_max_waiting}
                      onChange={(e) => setPolicyData((prev) => ({ ...prev, default_max_waiting: parsePolicyValue(e.target.value) }))}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={5}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 pr-10 text-[14px] text-gray-900 focus:ring-2 focus:ring-[#2D2A4A] focus:border-transparent outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-400 pointer-events-none">명</span>
                  </div>
                </div>

                {/* 호출 횟수 */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-gray-700">기본 호출 횟수</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={policyData.default_call_count}
                      onChange={(e) => setPolicyData((prev) => ({ ...prev, default_call_count: parsePolicyValue(e.target.value) }))}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={5}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 pr-10 text-[14px] text-gray-900 focus:ring-2 focus:ring-[#2D2A4A] focus:border-transparent outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-400 pointer-events-none">회</span>
                  </div>
                </div>

                {/* 호출 수명 */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-gray-700">기본 호출 수명 (초)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={policyData.default_call_ttl}
                      onChange={(e) => setPolicyData((prev) => ({ ...prev, default_call_ttl: parsePolicyValue(e.target.value) }))}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={5}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 pr-10 text-[14px] text-gray-900 focus:ring-2 focus:ring-[#2D2A4A] focus:border-transparent outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-400 pointer-events-none">sec</span>
                  </div>
                </div>

              </div>
            </div>

            {/* 구분선 */}
            <div className="h-px bg-gray-100" />

            {/* 포스터 업로드 */}
            <div className="flex flex-col gap-4 pb-4">
              <label className="text-[15px] font-bold text-gray-900">행사 포스터 수정</label>
              
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                  {formData.thumbnailImageUrl ? (
                    <img
                      src={formData.thumbnailImageUrl}
                      alt="Poster preview"
                      className="w-full h-full object-cover"
                      onError={() => {
                        // 이미지 로드 실패 시 URL 초기화 → React가 No Photo 플레이스홀더로 re-render
                        setFormData((prev) => ({ ...prev, thumbnailImageUrl: "" }));
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 select-none">
                      <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[11px] font-bold text-gray-400 tracking-wide">No Photo</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    id="thumbnail-edit-upload"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="thumbnail-edit-upload"
                    className="w-fit flex items-center justify-center gap-2 bg-white border-2 border-[#2D2A4A] text-[#2D2A4A] font-bold py-2.5 px-6 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    사진 변경
                  </label>
                  <div className="text-[13px] text-gray-400 mt-1 space-y-0.5 leading-relaxed">
                    <p>•  jpeg, jpg, png만 가능</p>
                    <p>•  파일 10MB 이하 업로드 가능</p>
                  </div>
                </div>
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

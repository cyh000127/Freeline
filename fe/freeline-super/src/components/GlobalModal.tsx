"use client";

import React from "react";
import { X } from "lucide-react";
import { useModal } from "@/context/ModalContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GlobalModal() {
  const { isOpen, message, type, onConfirm, onCancel, hideAlert } = useModal();

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    hideAlert();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    hideAlert();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-300">
      <div
        className={cn(
          "relative w-full max-w-[340px] bg-white rounded-[24px] shadow-2xl overflow-hidden text-black",
          "animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out"
        )}
      >
        {/* Close Button */}
        <button
          onClick={handleCancel}
          className="absolute top-5 right-5 p-1.5 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all duration-200 z-10"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        <div className="pt-12 pb-7 px-7 flex flex-col items-center text-center">
          {/* Content */}
          <div className="mb-8 w-full">
            <p className="text-[17px] font-bold text-gray-800 break-keep leading-[1.6] tracking-tight">
              {message.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < message.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
          </div>

          {/* Action Buttons */}
          <div className={cn(
            "w-full flex gap-2.5",
            type === "alert" ? "flex-col" : "flex-row-reverse"
          )}>
            <button
              onClick={handleConfirm}
              style={{ padding: '10px 0' }}
              className="flex-1 rounded-2xl text-[17px] font-black bg-[#2D2A4A] hover:bg-[#1e1c31] text-white shadow-lg shadow-[#2D2A4A]/20 transition-all duration-200 active:scale-[0.98] flex items-center justify-center border-0 cursor-pointer w-full"
            >
              확인
            </button>
            {type === "confirm" && (
              <button
                onClick={handleCancel}
                style={{ padding: '10px 0' }}
                className="flex-1 rounded-2xl text-[17px] font-bold bg-[#F1F3F5] hover:bg-[#E9ECEF] text-gray-600 border-0 transition-all duration-200 active:scale-[0.98] flex items-center justify-center cursor-pointer w-full"
              >
                취소
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

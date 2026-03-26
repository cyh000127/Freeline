"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface ModalContextType {
  showAlert: (message: string) => void;
  showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
  hideAlert: () => void;
  isOpen: boolean;
  message: string;
  type: "alert" | "confirm";
  onConfirm?: () => void;
  onCancel?: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"alert" | "confirm">("alert");
  const [onConfirm, setOnConfirm] = useState<(() => void) | undefined>();
  const [onCancel, setOnCancel] = useState<(() => void) | undefined>();

  const showAlert = useCallback((msg: string) => {
    setMessage(msg);
    setType("alert");
    setOnConfirm(undefined);
    setOnCancel(undefined);
    setIsOpen(true);
  }, []);

  const showConfirm = useCallback((msg: string, confirmCallback: () => void, cancelCallback?: () => void) => {
    setMessage(msg);
    setType("confirm");
    setOnConfirm(() => confirmCallback);
    setOnCancel(() => (cancelCallback ? cancelCallback : undefined));
    setIsOpen(true);
  }, []);

  const hideAlert = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ModalContext.Provider 
      value={{ 
        showAlert, 
        showConfirm,
        hideAlert, 
        isOpen, 
        message, 
        type, 
        onConfirm, 
        onCancel 
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}

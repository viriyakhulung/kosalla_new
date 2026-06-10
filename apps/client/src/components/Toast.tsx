"use client";

import { useEffect, useState } from "react";
import type { Toast as ToastType } from "@/types";

interface ToastProps {
  toast: ToastType;
  onClose: () => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const baseStyles =
    "px-4 py-3 rounded-lg shadow-lg text-white flex items-center gap-3 transform transition-all duration-300";

  const typeStyles: Record<string, string> = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };

  const icons: Record<string, string> = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  return (
    <div
      className={`${baseStyles} ${typeStyles[toast.type]} ${
        isExiting ? "opacity-0 translate-x-96" : "opacity-100 translate-x-0"
      }`}
    >
      <span className="text-xl flex-shrink-0">{icons[toast.type]}</span>
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-lg hover:text-gray-200 flex-shrink-0"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}

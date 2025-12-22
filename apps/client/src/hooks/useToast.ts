import { useContext } from "react";
import { ToastContext } from "@/context/ToastContext";
import type { ToastType } from "@/types";

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return {
    success: (message: string, duration?: number) =>
      context.showToast(message, "success", duration),
    error: (message: string, duration?: number) =>
      context.showToast(message, "error", duration),
    warning: (message: string, duration?: number) =>
      context.showToast(message, "warning", duration),
    info: (message: string, duration?: number) =>
      context.showToast(message, "info", duration),
  };
}

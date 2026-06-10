"use client";

import { useContext } from "react";
import { ToastContext } from "@/context/ToastContext";
import { Toast } from "./Toast";

export function ToastContainer() {
  const context = useContext(ToastContext);

  if (!context) return null;

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50 pointer-events-none">
      {context.toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            toast={toast}
            onClose={() => context.removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

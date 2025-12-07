"use client";
import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = "info", duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: "bg-green-500/20 border-green-500 text-green-400",
    error: "bg-red-500/20 border-red-500 text-red-400",
    info: "bg-blue-500/20 border-blue-500 text-blue-400",
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border backdrop-blur-lg animate-slide-up shadow-2xl ${colors[type]}`}
    >
      <div className="flex items-center gap-2">
        {type === "success" && <span className="text-xl">✓</span>}
        {type === "error" && <span className="text-xl">✗</span>}
        {type === "info" && <span className="text-xl">ℹ</span>}
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type?: ToastType } | null>(null);

  const showToast = (message: string, type?: ToastType) => {
    setToast({ message, type });
  };

  const ToastComponent = toast ? (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(null)}
    />
  ) : null;

  return { showToast, ToastComponent };
}


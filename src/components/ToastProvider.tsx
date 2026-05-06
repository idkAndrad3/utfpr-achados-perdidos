"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";

type Toast = {
  id: number;
  message: string;
  type: "success" | "error" | "info";
};

type ToastContextType = {
  show: (message: string, type?: Toast["type"]) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const flash = params.get("flash");
    const flashType = params.get("type") as Toast["type"] | null;
    if (flash) {
      show(decodeURIComponent(flash), flashType ?? "success");
      params.delete("flash");
      params.delete("type");
      const url =
        window.location.pathname +
        (params.toString() ? "?" + params.toString() : "");
      window.history.replaceState({}, "", url);
    }
  }, [show]);

  return (
    <SessionProvider>
      <ToastContext.Provider value={{ show }}>
        {children}
        <div
          aria-live="polite"
          className="fixed top-4 right-4 z-50 flex flex-col gap-2"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={
                "min-w-[260px] max-w-sm rounded-md border px-4 py-3 text-sm shadow-md " +
                (t.type === "success"
                  ? "bg-green-50 border-green-200 text-green-900"
                  : t.type === "error"
                  ? "bg-red-50 border-red-200 text-red-900"
                  : "bg-utfpr-50 border-utfpr-200 text-utfpr-900")
              }
              role="status"
            >
              {t.message}
            </div>
          ))}
        </div>
      </ToastContext.Provider>
    </SessionProvider>
  );
}

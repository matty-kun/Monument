import React from 'react';
import { X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: React.ReactNode;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isWide?: boolean;
  variant?: "default" | "destructive";
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isWide = false,
  variant = "default",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex h-full w-full items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm transition-all">
      <div className={`relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl transition-all dark:border-white/10 dark:bg-[#181818] ${isWide ? 'max-w-2xl w-full' : 'max-w-md w-full'}`}>
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-white/10">
          <div>
            <div className="text-[15px] font-semibold text-gray-950 dark:text-white">{title}</div>
            <div className="mt-1 text-[13px] leading-5 text-gray-500 dark:text-white/45">
              {message}
            </div>
          </div>
          <button
            type="button"
            className="admin-icon-button shrink-0"
            onClick={onClose}
            aria-label="Close confirmation"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-5">
          <div className={`rounded-xl border p-4 ${
            variant === "destructive"
              ? "border-[#FF453A]/20 bg-[#FF453A]/5"
              : "border-gray-200 bg-gray-50/60 dark:border-white/10 dark:bg-white/[0.03]"
          }`}>
            <p className="text-[13px] leading-5 text-gray-600 dark:text-white/55">
              {variant === "destructive"
                ? "This action cannot be undone. Review before continuing."
                : "Confirm this action to continue."}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-[#181818]/95">
            <button
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-[13px] font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
              onClick={onClose}
            >
              {cancelLabel}
            </button>
            <button
              className={`rounded-lg px-4 py-2 text-[13px] font-bold text-white shadow-sm transition active:scale-[0.99] ${
                variant === "destructive"
                  ? "bg-[#FF453A] hover:bg-[#d9362d]"
                  : "bg-[#269a7a] hover:bg-[#1b7359]"
              }`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

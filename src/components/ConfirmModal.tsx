import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: React.ReactNode;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isWide?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isWide = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-[9999] flex justify-center items-center p-4 backdrop-blur-md transition-all">
      <div className={`relative p-8 border shadow-2xl rounded-[2.5rem] bg-white dark:bg-gray-800 dark:border-gray-700 transition-all transform ${isWide ? 'max-w-2xl w-full' : 'max-w-md w-full'}`}>
        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <div className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">{title}</div>
            <div className="w-12 h-1.5 bg-monument-primary rounded-full"></div>
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {message}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <button
              className="bg-monument-primary hover:bg-monument-dark text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-violet-500/20 active:scale-95 text-xs uppercase tracking-widest"
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
            <button
              className="bg-gray-50 dark:bg-gray-900/50 hover:bg-red-500 hover:text-white text-gray-400 font-bold py-4 rounded-2xl transition-all border border-transparent hover:border-red-600 active:scale-95 text-xs uppercase tracking-widest"
              onClick={onClose}
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
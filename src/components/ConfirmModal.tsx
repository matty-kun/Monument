import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
      <div className="relative p-5 border w-96 shadow-lg rounded-2xl bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">{title}</h3>
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {message}
            </p>
          </div>
          <div className="items-center px-4 py-3 space-y-2 md:space-y-0 md:flex md:gap-4">
            <button
              id="confirm-btn"
              className="btn btn-danger w-full"
              onClick={onConfirm}
            >
              Confirm
            </button>
            <button
              id="cancel-btn"
              className="btn btn-secondary w-full"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
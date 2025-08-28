"use client";

import { useState } from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmButtonColor?: "red" | "green" | "indigo" | "yellow";
  cancelText?: string;
  requiredInput?: string; // If provided, shows text input confirmation
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  confirmButtonColor = "indigo",
  cancelText = "Cancel",
  requiredInput,
  isLoading = false,
}: ConfirmationModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    // If requiredInput is specified, validate the input
    if (
      requiredInput &&
      inputValue.toLowerCase().trim() !== requiredInput.toLowerCase()
    ) {
      setError(`You must type "${requiredInput}" to confirm`);
      return;
    }
    onConfirm();
    setInputValue("");
    setError("");
  };

  const handleClose = () => {
    setInputValue("");
    setError("");
    onClose();
  };

  const getConfirmButtonClasses = () => {
    const baseClasses =
      "flex-1 rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

    switch (confirmButtonColor) {
      case "red":
        return `${baseClasses} bg-red-600 hover:bg-red-700 focus:ring-red-500`;
      case "green":
        return `${baseClasses} bg-green-600 hover:bg-green-700 focus:ring-green-500`;
      case "yellow":
        return `${baseClasses} bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500`;
      default:
        return `${baseClasses} bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500`;
    }
  };

  const isConfirmDisabled = () => {
    if (isLoading) return true;
    if (requiredInput) {
      return inputValue.toLowerCase().trim() !== requiredInput.toLowerCase();
    }
    return false;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="bg-opacity-50 fixed inset-0 bg-black transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="mb-4">
            <div className="mb-3 flex items-center space-x-3">
              {/* Icon based on type */}
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                  confirmButtonColor === "red"
                    ? "bg-red-100"
                    : confirmButtonColor === "green"
                      ? "bg-green-100"
                      : confirmButtonColor === "yellow"
                        ? "bg-yellow-100"
                        : "bg-indigo-100"
                }`}
              >
                {confirmButtonColor === "red" ? (
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                ) : confirmButtonColor === "green" ? (
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                ) : confirmButtonColor === "yellow" ? (
                  <svg
                    className="h-6 w-6 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-6 w-6 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 073.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              </div>
            </div>
            <p className="text-sm text-gray-600">{message}</p>
          </div>

          {/* Conditional text input for destructive actions */}
          {requiredInput && (
            <div className="mb-4">
              <label
                htmlFor="confirmation-input"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Type &quot;{requiredInput}&quot; to confirm:
              </label>
              <input
                id="confirmation-input"
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError("");
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                placeholder={requiredInput}
                disabled={isLoading}
              />
              {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isConfirmDisabled()}
              className={getConfirmButtonClasses()}
            >
              {isLoading ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

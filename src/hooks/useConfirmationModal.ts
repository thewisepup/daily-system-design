import { useState, useCallback } from "react";

export interface ConfirmationModalState {
  isOpen: boolean;
  type: "approve" | "unapprove" | "sendEmail" | "delete" | "custom" | null;
  title: string;
  message: string;
  confirmText: string;
  confirmButtonColor: "red" | "green" | "indigo" | "yellow";
  onConfirm: () => void;
}

export interface UseConfirmationModalReturn {
  modalState: ConfirmationModalState;
  openModal: (config: {
    type?: ConfirmationModalState["type"];
    title: string;
    message: string;
    confirmText?: string;
    confirmButtonColor?: ConfirmationModalState["confirmButtonColor"];
    onConfirm: () => void;
  }) => void;
  closeModal: () => void;
}

export function useConfirmationModal(): UseConfirmationModalReturn {
  const [modalState, setModalState] = useState<ConfirmationModalState>({
    isOpen: false,
    type: null,
    title: "",
    message: "",
    confirmText: "Confirm",
    confirmButtonColor: "indigo",
    onConfirm: () => {
      // Default empty function - will be overridden by openModal
    },
  });

  const openModal = useCallback(
    (config: {
      type?: ConfirmationModalState["type"];
      title: string;
      message: string;
      confirmText?: string;
      confirmButtonColor?: ConfirmationModalState["confirmButtonColor"];
      onConfirm: () => void;
    }) => {
      setModalState({
        isOpen: true,
        type: config.type ?? "custom",
        title: config.title,
        message: config.message,
        confirmText: config.confirmText ?? "Confirm",
        confirmButtonColor: config.confirmButtonColor ?? "indigo",
        onConfirm: config.onConfirm,
      });
    },
    [],
  );

  const closeModal = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  return {
    modalState,
    openModal,
    closeModal,
  };
}

// Pre-configured modal configurations for common actions
export const MODAL_CONFIGS = {
  approve: {
    type: "approve" as const,
    title: "Approve Newsletter",
    message:
      "Are you sure you want to approve this newsletter? It will be ready for sending.",
    confirmText: "Approve",
    confirmButtonColor: "green" as const,
  },
  unapprove: {
    type: "unapprove" as const,
    title: "Move to Draft",
    message:
      "Are you sure you want to move this newsletter back to draft status?",
    confirmText: "Move to Draft",
    confirmButtonColor: "yellow" as const,
  },
  sendEmail: {
    type: "sendEmail" as const,
    title: "Send Newsletter",
    message:
      "Are you sure you want to send this newsletter to the admin email for testing?",
    confirmText: "Send Email",
    confirmButtonColor: "indigo" as const,
  },
} as const;

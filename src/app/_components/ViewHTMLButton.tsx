"use client";

// Utility function for merging classNames
function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

interface ViewHTMLButtonProps {
  htmlContent: string;
  title?: string;
  variant?: "default" | "small" | "header";
  className?: string;
  windowOptions?: string;
  disabled?: boolean;
}

export default function ViewHTMLButton({
  htmlContent,
  title = "View HTML in new window",
  variant = "default",
  className,
  windowOptions,
  disabled = false,
}: ViewHTMLButtonProps) {
  const handleViewHTML = () => {
    if (!htmlContent || disabled) return;

    const defaultWindowOptions =
      "width=800,height=900,scrollbars=yes,resizable=yes";
    const newWindow = window.open(
      "",
      "_blank",
      windowOptions ?? defaultWindowOptions,
    );

    if (newWindow) {
      newWindow.document.open();
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  const variantStyles = {
    default:
      "rounded-md bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 focus:outline-none",
    small:
      "rounded-md bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 focus:outline-none",
    header:
      "inline-flex items-center rounded bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 focus:outline-none",
  };

  return (
    <button
      onClick={handleViewHTML}
      disabled={disabled || !htmlContent}
      title={title}
      className={cn(
        variantStyles[variant],
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {variant === "header" && (
        <svg
          className="mr-1.5 h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      )}
      View HTML
    </button>
  );
}

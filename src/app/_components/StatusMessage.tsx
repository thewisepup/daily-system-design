interface StatusMessageProps {
  type: "error" | "success";
  title?: string;
  message: string;
  className?: string;
}

export default function StatusMessage({ 
  type, 
  title, 
  message, 
  className = "" 
}: StatusMessageProps) {
  const baseClasses = "mt-4 rounded-md p-4";
  const typeClasses = type === "error" 
    ? "bg-red-50" 
    : "bg-green-50";
  const textClasses = type === "error" 
    ? "text-red-700" 
    : "text-green-700";

  return (
    <div className={`${baseClasses} ${typeClasses} ${className}`}>
      <div className={`text-sm ${textClasses}`}>
        {title && <strong>{title}: </strong>}
        {message}
      </div>
    </div>
  );
}
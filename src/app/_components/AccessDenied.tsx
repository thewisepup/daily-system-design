interface AccessDeniedProps {
  title?: string;
  message?: string;
}

export default function AccessDenied({
  title = "Access Denied",
  message = "You do not have permission to access this page.",
}: AccessDeniedProps) {
  return (
    <div className="min-h-screen bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-red-600">{title}</h1>
        <p className="text-gray-700">{message}</p>
      </div>
    </div>
  );
}
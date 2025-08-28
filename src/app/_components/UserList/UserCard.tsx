import CopyButton from "../CopyButton";

interface User {
  id: string;
  email: string;
  createdAt: Date;
}

interface UserCardProps {
  user: User;
  copiedItems: Set<string>;
  onCopy: (text: string, itemId: string) => void;
}

export default function UserCard({ user, copiedItems, onCopy }: UserCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <p className="font-medium text-gray-900">{user.email}</p>
            <CopyButton
              isActive={copiedItems.has(`email-${user.id}`)}
              onClick={() => onCopy(user.email, `email-${user.id}`)}
              title="Copy email"
            />
          </div>
          <p className="text-sm text-gray-500">
            Joined: {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>ID: {user.id.substring(0, 8)}...</span>
          <CopyButton
            isActive={copiedItems.has(`id-${user.id}`)}
            onClick={() => onCopy(user.id, `id-${user.id}`)}
            title="Copy full user ID"
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCopyToClipboard } from "../../../hooks/useCopyToClipboard";
import Pagination from "../Pagination";
import UserCard from "./UserCard";

interface User {
  id: string;
  email: string;
  createdAt: Date;
}

interface UserListData {
  users: User[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

interface UserListProps {
  userList?: UserListData;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function UserList({
  userList,
  currentPage: _currentPage,
  onPageChange,
}: UserListProps) {
  const { copiedItems, copyToClipboard } = useCopyToClipboard();

  return (
    <div>
      {/* Users list */}
      <div className="space-y-2">
        {userList?.users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            copiedItems={copiedItems}
            onCopy={copyToClipboard}
          />
        ))}
      </div>

      {/* Show empty state if no users */}
      {userList?.users.length === 0 && (
        <div className="py-8 text-center text-gray-500">No users found.</div>
      )}

      {/* Pagination */}
      {userList && (
        <Pagination
          currentPage={userList.currentPage}
          totalPages={userList.totalPages}
          onPageChange={onPageChange}
        />
      )}

      {/* Results info */}
      {userList && userList.users.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-600">
          Showing page {userList.currentPage} of {userList.totalPages} (
          {userList.totalCount} total users)
        </div>
      )}
    </div>
  );
}

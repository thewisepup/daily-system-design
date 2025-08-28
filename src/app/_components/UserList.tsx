"use client";

import { useState } from "react";

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
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems((prev) => new Set([...prev, itemId]));
      // Clear the copied state after 2 seconds
      setTimeout(() => {
        setCopiedItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handlePageChange = (page: number) => {
    onPageChange(page);
  };

  const renderPagination = () => {
    if (!userList || userList.totalPages <= 1) return null;

    const pages = [];
    const totalPages = userList.totalPages;
    const current = userList.currentPage;

    // Show first page
    if (current > 3) {
      pages.push(1);
      if (current > 4) pages.push("...");
    }

    // Show pages around current
    for (
      let i = Math.max(1, current - 2);
      i <= Math.min(totalPages, current + 2);
      i++
    ) {
      pages.push(i);
    }

    // Show last page
    if (current < totalPages - 2) {
      if (current < totalPages - 3) pages.push("...");
      pages.push(totalPages);
    }

    return (
      <div className="mt-6 flex justify-center space-x-2">
        <button
          onClick={() => handlePageChange(current - 1)}
          disabled={current === 1}
          className="rounded bg-gray-200 px-3 py-1 text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === "number" && handlePageChange(page)}
            disabled={typeof page !== "number"}
            className={`rounded px-3 py-1 ${
              page === current
                ? "bg-blue-500 text-white"
                : typeof page === "number"
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "cursor-default bg-transparent text-gray-500"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(current + 1)}
          disabled={current === totalPages}
          className="rounded bg-gray-200 px-3 py-1 text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div>
      {/* Users list */}
      <div className="space-y-2">
        {userList?.users.map((user) => (
          <div
            key={user.id}
            className="rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <p className="font-medium text-gray-900">{user.email}</p>
                  <button
                    onClick={() =>
                      copyToClipboard(user.email, `email-${user.id}`)
                    }
                    className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                    title="Copy email"
                  >
                    {copiedItems.has(`email-${user.id}`) ? (
                      <svg
                        className="h-4 w-4 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>ID: {user.id.substring(0, 8)}...</span>
                <button
                  onClick={() => copyToClipboard(user.id, `id-${user.id}`)}
                  className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                  title="Copy full user ID"
                >
                  {copiedItems.has(`id-${user.id}`) ? (
                    <svg
                      className="h-4 w-4 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show empty state if no users */}
      {userList?.users.length === 0 && (
        <div className="py-8 text-center text-gray-500">No users found.</div>
      )}

      {/* Pagination */}
      {renderPagination()}

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

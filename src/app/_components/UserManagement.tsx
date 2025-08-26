"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function UserManagement() {
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set([...prev, itemId]));
      // Clear the copied state after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const {
    data: userList,
    isLoading: isLoadingUsers,
    error: userError,
  } = api.user.listUsers.useQuery({ page: currentPage });

  const {
    data: totalUsers,
    isLoading: isLoadingCount,
  } = api.user.getTotalCount.useQuery();

  if (isLoadingUsers || isLoadingCount) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="text-red-600">
        Error loading users: {userError.message}
      </div>
    );
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
    for (let i = Math.max(1, current - 2); i <= Math.min(totalPages, current + 2); i++) {
      pages.push(i);
    }

    // Show last page
    if (current < totalPages - 2) {
      if (current < totalPages - 3) pages.push("...");
      pages.push(totalPages);
    }

    return (
      <div className="flex justify-center space-x-2 mt-6">
        <button
          onClick={() => handlePageChange(current - 1)}
          disabled={current === 1}
          className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === "number" && handlePageChange(page)}
            disabled={typeof page !== "number"}
            className={`px-3 py-1 rounded ${
              page === current
                ? "bg-blue-500 text-white"
                : typeof page === "number"
                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                : "bg-transparent text-gray-500 cursor-default"
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => handlePageChange(current + 1)}
          disabled={current === totalPages}
          className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div>
      {/* Header with subscription count */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">User Management</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 font-medium">
            Total Subscribed Users: {totalUsers ?? 0}
          </p>
        </div>
      </div>

      {/* Users list */}
      <div className="space-y-2">
        {userList?.users.map((user) => (
          <div
            key={user.id}
            className="bg-gray-50 border border-gray-200 rounded-lg p-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-medium text-gray-900">{user.email}</p>
                  <button
                    onClick={() => copyToClipboard(user.email, `email-${user.id}`)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                    title="Copy email"
                  >
                    {copiedItems.has(`email-${user.id}`) ? (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                  title="Copy full user ID"
                >
                  {copiedItems.has(`id-${user.id}`) ? (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
        <div className="text-center py-8 text-gray-500">
          No users found.
        </div>
      )}

      {/* Pagination */}
      {renderPagination()}

      {/* Results info */}
      {userList && userList.users.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          Showing page {userList.currentPage} of {userList.totalPages} 
          ({userList.totalCount} total users)
        </div>
      )}
    </div>
  );
}
"use client";

import React, { useState } from "react";
import { api } from "~/trpc/react";
import { track } from "@vercel/analytics";
interface EmailSignupProps {
  onSuccess?: (email: string) => void;
}

export default function EmailSignup({ onSuccess }: EmailSignupProps) {
  const [email, setEmail] = useState("");

  const subscribe = api.user.subscribe.useMutation({
    onSuccess: (data) => {
      setEmail("");
      if (data?.email) {
        onSuccess?.(data.email);
        track("Signup");
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email) return;
    subscribe.mutate({ email });
  };

  return (
    <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-xl">
      <h2 className="mb-4 text-3xl font-bold text-gray-900">
        Subscribe for Free
      </h2>
      <p className="mb-6 text-gray-600">
        Get daily system design insights delivered to your inbox every morning.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 transition duration-200 outline-none focus:border-transparent focus:ring-2 focus:ring-indigo-500"
            disabled={subscribe.isPending}
          />
        </div>
        {subscribe.error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {subscribe.error.message}
          </div>
        )}
        <button
          type="submit"
          disabled={subscribe.isPending || !email}
          className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition duration-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {subscribe.isPending ? (
            <>
              <svg
                className="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Subscribing...
            </>
          ) : (
            "Subscribe for Free"
          )}
        </button>
      </form>
    </div>
  );
}

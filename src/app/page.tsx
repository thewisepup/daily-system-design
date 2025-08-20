"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function Home() {
  const [email, setEmail] = useState("");

  const addToWaitlist = api.user.addToWaitlist.useMutation({
    onSuccess: () => {
      setEmail("");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    addToWaitlist.mutate({ email });
  };

  const resetForm = () => {
    addToWaitlist.reset();
  };

  if (addToWaitlist.isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            Welcome to the waitlist!
          </h2>
          <p className="mb-6 text-gray-600">
            Thank you for joining our waitlist. We&apos;ve sent a confirmation
            to{" "}
            <span className="font-semibold text-indigo-600">
              {addToWaitlist.data?.email}
            </span>
          </p>
          <button
            onClick={resetForm}
            className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition duration-200 hover:bg-indigo-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          {/* Hero Section */}
          <div className="mb-16">
            <h1 className="mb-6 text-5xl leading-tight font-bold text-gray-900 md:text-6xl">
              <span className="text-indigo-600">Daily System Design</span>
              <br />
              <span className="text-3xl font-medium text-gray-700 md:text-4xl">
                Master System Design, One Day at a Time
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl leading-relaxed text-gray-600">
              Join thousands of engineers who receive daily insights on system
              design patterns, real-world architectures, and expert analysis.
              From microservices to distributed systems, level up your
              engineering skills with bite-sized, actionable content.
            </p>
          </div>

          {/* Features */}
          <div className="mb-16 grid gap-8 md:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  ></path>
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                Daily Insights
              </h3>
              <p className="text-gray-600">
                Get curated system design insights delivered to your inbox every
                morning
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  ></path>
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                Real Examples
              </h3>
              <p className="text-gray-600">
                Learn from actual system architectures used by leading tech
                companies
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <svg
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  ></path>
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                Expert Analysis
              </h3>
              <p className="text-gray-600">
                Deep dives into design decisions and trade-offs from industry
                experts
              </p>
            </div>
          </div>

          {/* Email Signup */}
          <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              Join the Waitlist
            </h2>
            <p className="mb-6 text-gray-600">
              Be the first to know when we launch. Get exclusive early access
              and bonus content.
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
                  disabled={addToWaitlist.isPending}
                />
              </div>
              {addToWaitlist.error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {addToWaitlist.error.message}
                </div>
              )}
              <button
                type="submit"
                disabled={addToWaitlist.isPending || !email}
                className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition duration-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {addToWaitlist.isPending ? (
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
                    Joining Waitlist...
                  </>
                ) : (
                  "Join the Waitlist"
                )}
              </button>
            </form>
            <p className="mt-4 text-sm text-gray-500">
              No spam, ever. Unsubscribe at any time.
            </p>
          </div>

          {/* Social Proof */}
          <div className="mt-16">
            <p className="mb-4 text-sm text-gray-500">
              Trusted by engineers at
            </p>
            <div className="flex items-center justify-center space-x-8 opacity-60">
              <span className="font-semibold text-gray-400">Google</span>
              <span className="font-semibold text-gray-400">Meta</span>
              <span className="font-semibold text-gray-400">Netflix</span>
              <span className="font-semibold text-gray-400">Uber</span>
              <span className="font-semibold text-gray-400">Airbnb</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

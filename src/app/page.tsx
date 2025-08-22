"use client";

import { useState } from "react";
import EmailSignup from "./_components/EmailSignup";
import EmailSignupSuccess from "./_components/EmailSignupSuccess";

export default function Home() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState("");

  const resetForm = () => {
    setShowSuccess(false);
    setSuccessEmail("");
  };

  if (showSuccess) {
    return <EmailSignupSuccess email={successEmail} onReset={resetForm} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          {/* Hero Section */}
          <div className="mb-16">
            <h1 className="mb-6 text-5xl leading-tight font-bold text-gray-900 md:text-6xl">
              <span className="text-indigo-600">System Design Newsletter</span>
              <br />
              <span className="text-3xl font-medium text-gray-700 md:text-4xl">
                Master System Design, One Day at a Time
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl leading-relaxed text-gray-600">
              1 concept a day, <br />
              10 minutes a day. <br />
              Ace Your Next Technical Interview
            </p>
          </div>

          {/* Email Signup */}
          <div className="mb-16">
            <EmailSignup
              onSuccess={(email) => {
                setSuccessEmail(email);
                setShowSuccess(true);
              }}
            />
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
                Learn real system architectures with real world examples
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
                Deep dives into design decisions and trade-offs like the real
                world.
              </p>
            </div>
          </div>

          {/* Social Proof */}
          {/* <div className="mt-16">
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
          </div> */}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import EmailSignup from "./_components/EmailSignup";
import EmailSignupSuccess from "./_components/EmailSignupSuccess";
import FeaturesSection from "./_components/FeaturesSection";
import SubscriberCount from "./_components/SubscriberCount";
import NewsletterPreviewSection from "./_components/NewsletterPreviewSection";

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
          <div className="mb-8">
            <h1 className="mb-6 text-5xl leading-tight font-bold text-gray-900 md:text-6xl">
              <span className="text-indigo-600">Daily System Design</span>
              <br />
              <span className="text-3xl font-medium text-gray-700 md:text-4xl">
                Master System Design, One Newsletter at a Time.
              </span>
            </h1>
            <p className="mx-auto mb-6 max-w-2xl text-xl leading-relaxed text-gray-600">
              1 concept a day, <br />
              10 minutes a day. <br />
              Ace Your Next Technical Interview.
            </p>

            {/* AI Generated Content Note */}
            <p className="mx-auto mb-4 max-w-2xl text-sm text-gray-500 italic">
              Note: All newsletter content is generated with AI
            </p>

            {/* Subscriber Count */}
            <div className="mb-8">
              <SubscriberCount />
            </div>
          </div>

          {/* Email Signup */}
          <div className="mb-12">
            <EmailSignup
              onSuccess={(email) => {
                setSuccessEmail(email);
                setShowSuccess(true);
              }}
            />
          </div>

          {/* Features */}
          <FeaturesSection />

          {/* Newsletter Preview */}
          <NewsletterPreviewSection />

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

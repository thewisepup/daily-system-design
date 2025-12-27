"use client";

import { useState } from "react";
import EmailSignup from "./_components/EmailSignup";
import EmailSignupSuccess from "./_components/EmailSignupSuccess";
import SubscriberCount from "./_components/SubscriberCount";
import RecentNewsletters from "./_components/RecentNewsletters";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      {/* Centered Content */}
      <div className="flex w-full flex-col justify-center px-8 py-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-lg">
          {/* Header */}
          <div className="text-accent mb-2 flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
            Daily System Design
            <SubscriberCount badge />
          </div>

          {/* Main Title */}
          <h1 className="text-foreground mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Master System Design,{" "}
            <span className="text-accent">One Newsletter at a Time.</span>
          </h1>

          {/* Subtext */}
          <p className="text-muted-foreground mb-8 text-xl">
            1 concept a day, 10 minutes a day. Ace your next technical
            interview.
          </p>

          {/* Email Signup */}
          <div className="mb-10">
            <EmailSignup
              minimal
              onSuccess={(email) => {
                setSuccessEmail(email);
                setShowSuccess(true);
              }}
            />
          </div>

          {/* Recent Newsletters */}
          <div className="mb-10">
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-500 uppercase">
              Recent Issues
            </h3>
            <RecentNewsletters />
          </div>

          {/* Footer Info */}
          <div className="flex flex-col gap-2 text-sm text-gray-500">
            <p className="italic">
              Note: All newsletter content is generated with AI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

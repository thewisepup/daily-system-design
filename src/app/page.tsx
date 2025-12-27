"use client";

import { useState } from "react";
import Image from "next/image";
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
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left Column: Content */}
      <div className="flex w-full flex-col justify-center bg-white px-8 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-lg">
          {/* Header */}
          <div className="mb-2 text-sm font-bold uppercase tracking-wider text-accent">
            Daily System Design
          </div>

          {/* Main Title */}
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Master System Design,{" "}
            <span className="text-accent">One Newsletter at a Time.</span>
          </h1>

          {/* Subtext */}
          <p className="mb-8 text-xl text-muted-foreground">
            1 concept a day, 10 minutes a day. Ace your next technical interview.
          </p>

          {/* Email Signup */}
          <div className="mb-10">
            <EmailSignup
              onSuccess={(email) => {
                setSuccessEmail(email);
                setShowSuccess(true);
              }}
            />
          </div>

          {/* Recent Newsletters */}
          <div className="mb-10">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Recent Issues
            </h3>
            <RecentNewsletters />
          </div>

          {/* Footer Info */}
          <div className="flex flex-col gap-2 text-sm text-gray-500">
            <SubscriberCount />
            <p className="italic">
              Note: All newsletter content is generated with AI
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Image */}
      <div className="relative h-64 w-full bg-accent/20 lg:h-auto lg:w-1/2 order-last lg:order-none">
        <Image
          src="https://images.unsplash.com/photo-1558494949-ef526b0042a0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80"
          alt="Server room abstract visualization"
          fill
          className="object-cover opacity-80 mix-blend-overlay"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-accent/90 to-purple-900/90 mix-blend-multiply" />
      </div>
    </div>
  );
}

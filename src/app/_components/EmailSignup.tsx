"use client";

import React, { useState } from "react";
import { api } from "~/trpc/react";
import { track } from "@vercel/analytics";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Spinner } from "~/app/_components/Spinner";

interface EmailSignupProps {
  onSuccess?: (email: string) => void;
  minimal?: boolean;
}

export default function EmailSignup({
  onSuccess,
  minimal = false,
}: EmailSignupProps) {
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
    <Card className="mx-auto max-w-lg">
      {!minimal && (
        <CardHeader>
          <CardTitle className="text-3xl">Subscribe for Free</CardTitle>
          <CardDescription>
            Get daily system design insights delivered to your inbox every
            morning.
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            disabled={subscribe.isPending}
          />
          {subscribe.error && (
            <Alert variant="destructive">
              <AlertDescription>{subscribe.error.message}</AlertDescription>
            </Alert>
          )}
          <Button
            type="submit"
            disabled={subscribe.isPending || !email}
            className="w-full"
            variant="default"
          >
            {subscribe.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Subscribing...
              </>
            ) : (
              "Subscribe for Free"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

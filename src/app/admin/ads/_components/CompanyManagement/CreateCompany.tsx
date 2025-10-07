"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { useNotifications, createNotification } from "~/hooks/useNotifications";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export function CreateCompany() {
  const [companyName, setCompanyName] = useState("");
  const { notifications, addNotification, removeNotification } =
    useNotifications();

  const createCompanyMutation = api.company.createCompany.useMutation({
    onSuccess: () => {
      addNotification(
        createNotification.success("Company created successfully!", {
          title: "Success",
        }),
      );
      // Clear form on success
      setCompanyName("");
    },
    onError: (error) => {
      addNotification(
        createNotification.error(
          error.message ?? "Failed to create company. Please try again.",
          {
            title: "Error",
          },
        ),
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      addNotification(
        createNotification.error("Company name is required", {
          title: "Validation Error",
        }),
      );
      return;
    }

    createCompanyMutation.mutate({ companyName: companyName.trim() });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Notifications */}
      <div className="space-y-2">
        {notifications.map((notification) => (
          <Alert
            key={notification.id}
            variant={notification.type === "error" ? "destructive" : "default"}
            className="relative"
          >
            {notification.type === "success" && (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {notification.type === "error" && (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{notification.title}</AlertTitle>
            <AlertDescription>{notification.message}</AlertDescription>
            <button
              onClick={() => removeNotification(notification.id)}
              className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Close notification"
            >
              ✕
            </button>
          </Alert>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="companyName"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Company Name
          </label>
          <Input
            id="companyName"
            type="text"
            placeholder="Enter company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            disabled={createCompanyMutation.isPending}
            className="w-full"
          />
        </div>

        <Button
          type="submit"
          disabled={createCompanyMutation.isPending}
          className="w-full"
        >
          {createCompanyMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Company"
          )}
        </Button>
      </form>
    </div>
  );
}

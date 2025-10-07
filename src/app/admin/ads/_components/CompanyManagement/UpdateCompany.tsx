"use client";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Info } from "lucide-react";

export function UpdateCompany() {
  return (
    <div className="mx-auto max-w-2xl">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>TODO</AlertTitle>
        <AlertDescription>
          Update company functionality will be implemented here. This will
          include:
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Company selection dropdown</li>
            <li>Form to update company name</li>
            <li>Integration with patchCompany API</li>
            <li>Loading states and notifications</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}

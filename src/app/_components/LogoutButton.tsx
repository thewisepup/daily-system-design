"use client";

import { Button } from "~/components/ui/button";
import { clearAdminAuth } from "~/lib/auth";

export function LogoutButton() {
  return (
    <Button variant="outline" onClick={clearAdminAuth}>
      Logout
    </Button>
  );
}


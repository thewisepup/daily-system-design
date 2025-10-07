"use client";
import { useEffect, useState } from "react";
import { isAdmin } from "~/lib/auth";
import "~/styles/globals.css";
import AdminLogin from "../_components/AdminLogin";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(isAdmin());
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(isAdmin());
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }
  return <>{children}</>;
}

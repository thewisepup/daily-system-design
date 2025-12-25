import "~/styles/globals.css";
import { Analytics } from "@vercel/analytics/next";
import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Daily System Design",
  description:
    "Join thousands of engineers learning system design through daily insights, real-world examples, and expert analysis.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} dark`}>
      <body>
        <TRPCReactProvider>
          {children}
          <SpeedInsights />
        </TRPCReactProvider>
        <Analytics />
      </body>
    </html>
  );
}

import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "GymFlow",
  description:
    "A public MVP for managing gym operations, workouts, schedules, and member progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

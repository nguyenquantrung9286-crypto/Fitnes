import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fitnes — Панель тренера",
  description: "Панель управления для тренера Fitnes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}

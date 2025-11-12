import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fin-OS - Local Financial Agent",
  description: "A local-first financial and tax management system",
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

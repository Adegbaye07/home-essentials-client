import type { Metadata } from "next";

import { AppProviders } from "@/components/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Home Essentials by Kamgol",
  description:
    "Home Essentials by Kamgol — foot mats, door mats, center mats, rugs, and cleaning essentials.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

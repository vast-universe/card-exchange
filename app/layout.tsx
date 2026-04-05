import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Card Exchange",
  description: "Cloudflare 上的卡密兑换与售后站点",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

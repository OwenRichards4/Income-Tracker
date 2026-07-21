import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { DEFAULT_THEME, isTheme, THEME_COOKIE } from "@/lib/theme";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finance Tracker",
  description:
    "Log income, track effective hourly rate, and estimate taxes owed.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Finance Tracker",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE)?.value;
  const theme = isTheme(themeCookie) ? themeCookie : DEFAULT_THEME;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${theme === "dark" ? "dark" : ""} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}

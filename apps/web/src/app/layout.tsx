import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/theme-provider";
import { FaviconateProvider } from "@/components/FaviconateContext";
import { cn } from "@/lib/utils";
import { GoogleAnalytics } from "@next/third-parties/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Faviconate",
  description: "Awesome favicon editor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className={cn(inter.className, " overflow-hidden")}>
        <GoogleAnalytics gaId={"G-DN96F2RSB4"} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FaviconateProvider>{children}</FaviconateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

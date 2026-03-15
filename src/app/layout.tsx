// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "App Template",
  description: "Full-stack Next.js template",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "#18181b", color: "#f4f4f5", border: "1px solid #3f3f46" },
          }}
        />
      </body>
    </html>
  );
}

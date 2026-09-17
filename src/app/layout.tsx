import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal Kuesioner & Survey Online",
  description: "Layanan pengisian survey dan evaluasi mutu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

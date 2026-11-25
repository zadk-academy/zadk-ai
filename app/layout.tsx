import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZADK & AI | زادك والذكاء الاصطناعي",
  description: "كيف تستخدم أكاديمية زادك الذكاء الاصطناعي في المطبخ: ثلاث أدوات للطهاة والطلاب.",
  icons: { icon: "/zadk-logo.webp" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#123f32" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600&family=Montserrat:wght@500;600&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}

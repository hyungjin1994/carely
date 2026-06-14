import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/common/sw-register";

export const metadata: Metadata = {
  title: "Carely",
  description: "엄마와 자녀가 함께 건강을 챙기는 앱",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Carely" },
};

// 시니어 대상이라 핀치줌을 막지 않는다 (maximumScale 미설정).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0066FF",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        {/* 데스크톱에서는 폰 프레임처럼, 모바일에서는 전체 화면 */}
        <div className="cy-page">
          <div className="cy-app">{children}</div>
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

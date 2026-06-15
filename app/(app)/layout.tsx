import { requireSenior } from "@/lib/auth/dal";
import { TabBar } from "@/components/common/tab-bar";
import { ToastHost } from "@/components/common/toast";
import { ThemeRoot } from "@/components/common/theme-root";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireSenior();

  return (
    <div
      data-contrast={profile.high_contrast ? "high" : "normal"}
      style={{
        // 서버 첫 페인트부터 글자배율/테마 적용 (FOUC 방지)
        ["--fs" as string]: String(profile.font_scale),
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ThemeRoot fontScale={profile.font_scale} highContrast={profile.high_contrast} />
      <div className="cy-content">{children}</div>
      <TabBar />
      <ToastHost />
    </div>
  );
}

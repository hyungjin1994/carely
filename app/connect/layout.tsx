import { requireManager } from "@/lib/auth/dal";
import { ToastHost } from "@/components/common/toast";
import { ThemeRoot } from "@/components/common/theme-root";

export default async function ConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireManager();
  return (
    <div
      data-contrast={profile.high_contrast ? "high" : "normal"}
      style={{
        ["--fs" as string]: String(profile.font_scale),
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ThemeRoot fontScale={profile.font_scale} highContrast={profile.high_contrast} />
      <div className="cy-content">{children}</div>
      <ToastHost />
    </div>
  );
}

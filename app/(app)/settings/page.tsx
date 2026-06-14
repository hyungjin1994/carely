import { ensureProfile } from "@/lib/auth/dal";
import { SettingsView } from "./settings-view";

export default async function SettingsPage() {
  const profile = await ensureProfile();
  return (
    <SettingsView
      name={profile.name ?? ""}
      fontScale={profile.font_scale}
      highContrast={profile.high_contrast}
      notifyOn={profile.notify_on}
    />
  );
}

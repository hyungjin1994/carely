import { SkeletonCard } from "@/components/common/skeleton";

export default function Loading() {
  return (
    <div style={{ padding: "4px 22px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      <SkeletonCard h={120} style={{ borderRadius: 24 }} />
      <SkeletonCard h={110} style={{ borderRadius: 24 }} />
      <SkeletonCard h={120} style={{ borderRadius: 24 }} />
      <SkeletonCard h={68} style={{ borderRadius: 20 }} />
      <SkeletonCard h={88} style={{ borderRadius: 24 }} />
    </div>
  );
}

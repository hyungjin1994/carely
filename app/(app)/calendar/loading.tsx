import { Skeleton, SkeletonCard } from "@/components/common/skeleton";

export default function Loading() {
  return (
    <div style={{ padding: "4px 22px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, height: 48, marginBottom: 8 }}>
        <Skeleton w={24} h={24} r={8} />
        <Skeleton w={80} h={22} />
      </div>
      <Skeleton w={120} h={22} r={8} style={{ margin: "6px auto 14px" }} />
      <SkeletonCard h={280} style={{ borderRadius: 16 }} />
      <Skeleton w={120} h={20} style={{ margin: "22px 0 12px" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SkeletonCard h={64} style={{ borderRadius: 16 }} />
        <SkeletonCard h={64} style={{ borderRadius: 16 }} />
      </div>
    </div>
  );
}

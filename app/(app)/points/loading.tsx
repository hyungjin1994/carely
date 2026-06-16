import { Skeleton, SkeletonCard } from "@/components/common/skeleton";

export default function Loading() {
  return (
    <div style={{ padding: "4px 22px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, height: 48, marginBottom: 8 }}>
        <Skeleton w={24} h={24} r={8} />
        <Skeleton w={80} h={22} />
      </div>
      <SkeletonCard h={150} style={{ borderRadius: 26 }} />
      <SkeletonCard h={64} style={{ borderRadius: 18, marginTop: 16 }} />
      <Skeleton w={100} h={20} style={{ margin: "24px 0 12px" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} h={64} style={{ borderRadius: 16 }} />
        ))}
      </div>
    </div>
  );
}

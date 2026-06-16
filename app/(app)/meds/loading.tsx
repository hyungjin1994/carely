import { Skeleton, SkeletonCard } from "@/components/common/skeleton";

export default function Loading() {
  return (
    <div style={{ padding: "4px 22px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, height: 48, marginBottom: 8 }}>
        <Skeleton w={24} h={24} r={8} />
        <Skeleton w={90} h={22} />
      </div>
      <SkeletonCard h={56} style={{ borderRadius: 16, marginBottom: 18 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} h={84} style={{ borderRadius: 18 }} />
        ))}
      </div>
    </div>
  );
}

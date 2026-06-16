import { Skeleton, SkeletonCard } from "@/components/common/skeleton";

export default function Loading() {
  return (
    <div style={{ padding: "6px 22px 28px" }}>
      <Skeleton w={140} h={28} style={{ margin: "8px 0 8px" }} />
      <Skeleton w={220} h={16} style={{ marginBottom: 20 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <SkeletonCard key={i} h={92} style={{ borderRadius: 22 }} />
        ))}
      </div>
    </div>
  );
}

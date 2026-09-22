import { Skeleton, SkeletonCard } from "@/components/common/skeleton";

export default function Loading() {
  return (
    <div style={{ padding: "6px 22px 28px" }}>
      <Skeleton w={200} h={28} style={{ margin: "8px 0 22px" }} />
      <SkeletonCard h={72} style={{ borderRadius: 24 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <SkeletonCard key={i} h={150} style={{ borderRadius: 24 }} />
        ))}
      </div>
    </div>
  );
}

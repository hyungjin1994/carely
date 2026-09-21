import { Skeleton, SkeletonCard } from "@/components/common/skeleton";

export default function Loading() {
  return (
    <div style={{ padding: "6px 22px 28px" }}>
      <Skeleton w={180} h={28} style={{ margin: "8px 0 22px" }} />
      <SkeletonCard h={56} style={{ borderRadius: 18 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} h={168} style={{ borderRadius: 24 }} />
        ))}
      </div>
    </div>
  );
}

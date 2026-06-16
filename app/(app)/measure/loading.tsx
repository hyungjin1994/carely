import { Skeleton, SkeletonCard } from "@/components/common/skeleton";

export default function Loading() {
  return (
    <div style={{ padding: "4px 22px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, height: 48, marginBottom: 8 }}>
        <Skeleton w={24} h={24} r={8} />
        <Skeleton w={70} h={22} />
      </div>
      <Skeleton w={240} h={16} style={{ marginBottom: 16 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} h={120} style={{ borderRadius: 20 }} />
        ))}
      </div>
      <Skeleton w={100} h={20} style={{ margin: "24px 0 12px" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} h={64} style={{ borderRadius: 16 }} />
        ))}
      </div>
    </div>
  );
}

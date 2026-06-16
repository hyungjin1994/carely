import { Skeleton, SkeletonCard } from "@/components/common/skeleton";

export default function Loading() {
  return (
    <div style={{ padding: "4px 22px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, height: 48, marginBottom: 8 }}>
        <Skeleton w={24} h={24} r={8} />
        <Skeleton w={120} h={22} />
      </div>
      <SkeletonCard h={64} style={{ borderRadius: 18, marginBottom: 18 }} />
      {[0, 1].map((i) => (
        <div key={i} style={{ border: "1px solid var(--c-line)", borderRadius: 20, overflow: "hidden", marginBottom: 16 }}>
          <Skeleton w="100%" h={200} r={0} />
          <div style={{ padding: 14 }}>
            <Skeleton w={120} h={16} style={{ marginBottom: 8 }} />
            <Skeleton w="80%" h={14} />
          </div>
        </div>
      ))}
    </div>
  );
}

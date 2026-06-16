import { Skeleton, SkeletonCard } from "@/components/common/skeleton";

export default function Loading() {
  return (
    <div style={{ padding: "4px 22px 28px" }}>
      <Skeleton w={100} h={24} style={{ margin: "6px 0 16px" }} />
      <SkeletonCard h={64} style={{ borderRadius: 18, marginBottom: 16 }} />
      <SkeletonCard h={84} style={{ borderRadius: 18 }} />
      <Skeleton w={110} h={20} style={{ margin: "24px 0 12px" }} />
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

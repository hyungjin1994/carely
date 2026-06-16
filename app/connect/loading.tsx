import { Skeleton, SkeletonCard } from "@/components/common/skeleton";

export default function Loading() {
  return (
    <div style={{ padding: "12px 22px 28px" }}>
      <Skeleton w={120} h={28} style={{ marginBottom: 20 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {[0, 1].map((i) => (
          <div key={i} style={{ border: "1px solid var(--c-line)", borderRadius: 22, padding: 16, background: "var(--c-card)" }}>
            <Skeleton w={150} h={22} style={{ marginBottom: 14 }} />
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <SkeletonCard h={70} />
              <SkeletonCard h={70} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <SkeletonCard h={70} />
              <SkeletonCard h={70} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

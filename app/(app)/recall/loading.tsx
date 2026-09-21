import { Skeleton, SkeletonCard } from "@/components/common/skeleton";

export default function Loading() {
  return (
    <div style={{ padding: "6px 22px 28px" }}>
      <Skeleton w={160} h={28} style={{ margin: "8px 0 22px" }} />
      <SkeletonCard h={150} style={{ borderRadius: 24 }} />
      <SkeletonCard h={150} style={{ borderRadius: 18, marginTop: 18 }} />
      <SkeletonCard h={64} style={{ borderRadius: 18, marginTop: 14 }} />
    </div>
  );
}

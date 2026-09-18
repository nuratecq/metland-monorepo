import { Sk } from "@/components/ui/Skeleton";

export default function ApprovalsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Sk className="h-8 w-28" />
        <Sk className="h-4 w-56" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-[var(--color-outline-variant)]">
          <Sk className="h-5 flex-1" />
          <Sk className="h-5 w-24" />
          <Sk className="h-8 w-20" />
          <Sk className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

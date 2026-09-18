import { Sk } from "@/components/ui/Skeleton";

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Sk className="h-8 w-24" />
          <Sk className="h-4 w-48" />
        </div>
        <Sk className="h-9 w-28" />
      </div>
      <div className="rounded-lg border border-[var(--color-outline-variant)] overflow-hidden">
        <Sk className="h-10 rounded-none" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-t border-[var(--color-outline-variant)]">
            <Sk className="h-4 flex-1" />
            <Sk className="h-4 w-32" />
            <Sk className="h-5 w-16" />
            <Sk className="h-8 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

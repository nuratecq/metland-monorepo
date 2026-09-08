import { Sk } from "@/components/ui/Skeleton";

export default function EmployeesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Sk className="h-8 w-36" />
        <Sk className="h-4 w-64" />
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Sk key={i} className="h-20" />
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[var(--color-outline-variant)] overflow-hidden">
        <Sk className="h-10 rounded-none" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-t border-[var(--color-outline-variant)]">
            <Sk className="w-8 h-8 rounded-full shrink-0" />
            <Sk className="h-4 flex-1" />
            <Sk className="h-4 w-24" />
            <Sk className="h-5 w-14" />
            <Sk className="h-4 w-32" />
            <Sk className="h-3 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

import { Sk } from "@/components/ui/Skeleton";

export default function AdminRolesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Sk className="h-8 w-24" />
        <Sk className="h-4 w-48" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-[var(--color-outline-variant)]">
          <Sk className="h-5 flex-1" />
          <Sk className="h-5 w-32" />
          <Sk className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

import { Sk } from "@/components/ui/Skeleton";

export default function DocumentsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Sk className="h-8 w-32" />
          <Sk className="h-4 w-56" />
        </div>
        <Sk className="h-9 w-28" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <Sk key={i} className="h-28" />
        ))}
      </div>
    </div>
  );
}

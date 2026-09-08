import { Sk } from "@/components/ui/Skeleton";

export default function TasksLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Sk className="h-8 w-48" />
          <Sk className="h-4 w-64" />
        </div>
        <Sk className="h-9 w-28" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Sk key={i} className="h-8 w-24" />
        ))}
      </div>

      {/* Board columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="space-y-3">
            <Sk className="h-7 w-full" />
            {Array.from({ length: 3 + col }).map((_, j) => (
              <Sk key={j} className="h-20 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

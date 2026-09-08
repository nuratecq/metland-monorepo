import { Sk } from "@/components/ui/Skeleton";

export default function TasksGlobalLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Sk className="h-8 w-36" />
        <Sk className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="space-y-3">
            <Sk className="h-7 w-full" />
            {Array.from({ length: 4 }).map((_, j) => (
              <Sk key={j} className="h-20 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

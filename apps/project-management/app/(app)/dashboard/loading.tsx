import { Sk } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Sk className="h-8 w-40" />
        <Sk className="h-4 w-72" />
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Sk key={i} className="h-20" />
        ))}
      </div>

      {/* Health + Task board */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Sk className="h-52" />
        <Sk className="h-52" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Sk className="h-64" />
        <Sk className="h-64" />
        <Sk className="h-64" />
      </div>
    </div>
  );
}

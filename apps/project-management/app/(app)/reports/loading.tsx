import { Sk } from "@/components/ui/Skeleton";

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Sk className="h-8 w-28" />
        <Sk className="h-4 w-56" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Sk className="h-64" />
        <Sk className="h-64" />
      </div>
      <Sk className="h-48" />
    </div>
  );
}

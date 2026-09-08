import { Sk } from "@/components/ui/Skeleton";

export default function ScheduleLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Sk className="h-8 w-28" />
          <Sk className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Sk className="h-9 w-20" />
          <Sk className="h-9 w-20" />
        </div>
      </div>
      <Sk className="h-[60vh] w-full" />
    </div>
  );
}

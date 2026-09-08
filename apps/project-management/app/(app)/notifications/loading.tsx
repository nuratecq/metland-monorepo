import { Sk } from "@/components/ui/Skeleton";

export default function NotificationsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Sk className="h-8 w-36" />
        <Sk className="h-4 w-48" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4 rounded-lg border border-[var(--color-outline-variant)]">
          <Sk className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Sk className="h-4 w-3/4" />
            <Sk className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

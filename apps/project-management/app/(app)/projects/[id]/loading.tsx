import { Sk } from "@/components/ui/Skeleton";

export default function ProjectDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Sk className="h-8 w-56" />
        <Sk className="h-4 w-72" />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Sk key={i} className="h-28" />
        ))}
      </div>
      <Sk className="h-64 w-full" />
    </div>
  );
}

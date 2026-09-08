import { Sk } from "@/components/ui/Skeleton";

export default function NewProjectLoading() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-1.5">
        <Sk className="h-8 w-36" />
        <Sk className="h-4 w-56" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Sk className="h-4 w-24" />
          <Sk className="h-10 w-full" />
        </div>
      ))}
      <Sk className="h-10 w-32" />
    </div>
  );
}

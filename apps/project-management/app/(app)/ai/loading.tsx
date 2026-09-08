import { Sk } from "@/components/ui/Skeleton";

export default function AiLoading() {
  return (
    <div className="flex flex-col h-full gap-4">
      <div className="space-y-1.5">
        <Sk className="h-8 w-36" />
        <Sk className="h-4 w-56" />
      </div>
      <Sk className="flex-1" />
      <Sk className="h-12 w-full" />
    </div>
  );
}

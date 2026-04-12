"use client";

function Pulse({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-zinc-800 ${className}`} />;
}

export function TimerSkeleton() {
  return (
    <div className="flex flex-col h-full select-none">
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <Pulse className="w-20 h-4" />
        <Pulse className="w-6 h-6 rounded-full" />
      </div>
      <div className="flex flex-col flex-1">
        <div className="flex-1 flex flex-col items-center justify-center gap-3 min-h-[120px]">
          <Pulse className="w-16 h-3" />
          <Pulse className="w-40 h-12" />
          <Pulse className="w-10 h-3" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 min-h-[120px]">
          <Pulse className="w-16 h-3" />
          <Pulse className="w-40 h-12" />
          <Pulse className="w-10 h-3" />
        </div>
      </div>
      <div className="flex gap-3 px-4 py-4 bg-zinc-900 border-t border-zinc-800">
        <Pulse className="flex-1 h-12 rounded-xl" />
        <Pulse className="flex-1 h-12 rounded-xl" />
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <Pulse className="w-16 h-4" />
        <Pulse className="w-20 h-4" />
        <div className="w-16" />
      </div>
      <div className="flex-1 px-4 py-6 flex flex-col gap-6">
        <div className="flex gap-2 justify-center">
          <Pulse className="w-20 h-9 rounded-xl" />
          <Pulse className="w-20 h-9 rounded-xl" />
          <Pulse className="w-20 h-9 rounded-xl" />
          <Pulse className="w-20 h-9 rounded-xl" />
        </div>
        <div className="flex flex-col gap-3">
          <Pulse className="w-full h-14 rounded-xl" />
          <Pulse className="w-full h-14 rounded-xl" />
        </div>
        <Pulse className="w-full h-40 rounded-xl" />
      </div>
    </div>
  );
}

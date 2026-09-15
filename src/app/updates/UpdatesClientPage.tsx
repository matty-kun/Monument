"use client";

import { Bell, EyeOff } from "lucide-react";

export type PublicUpdate = {
  id: string;
  type: "result" | "live" | "upcoming" | "finished";
  tone: "gold" | "silver" | "bronze" | "live" | "upcoming" | "finished";
  title: string;
  description: string;
  meta: string;
  timestamp: string;
};

const toneStyles: Record<PublicUpdate["tone"], { dot: string; label: string }> = {
  gold: { dot: "bg-[#f7c948]", label: "text-[#f7c948]" },
  silver: { dot: "bg-white/65", label: "text-white/65" },
  bronze: { dot: "bg-[#d18b5b]", label: "text-[#d18b5b]" },
  live: { dot: "bg-[#30d158]", label: "text-[#30d158]" },
  upcoming: { dot: "bg-[#64d2ff]", label: "text-[#64d2ff]" },
  finished: { dot: "bg-white/40", label: "text-white/45" },
};

const formatRelativeTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = date.getTime() - Date.now();
  const absMinutes = Math.round(Math.abs(diffMs) / 60000);

  if (absMinutes < 1) return "Just now";
  if (absMinutes < 60) return diffMs < 0 ? `${absMinutes}m ago` : `in ${absMinutes}m`;

  const absHours = Math.round(absMinutes / 60);
  if (absHours < 24) return diffMs < 0 ? `${absHours}h ago` : `in ${absHours}h`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function UpdatesClientPage({
  mysteryMode,
  updates,
}: {
  mysteryMode: boolean;
  updates: PublicUpdate[];
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black pb-24 font-sans text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-52 bg-[linear-gradient(to_bottom,rgba(22,163,74,0.34)_0%,rgba(22,163,74,0.22)_32%,rgba(22,163,74,0.08)_62%,transparent_100%)]"
      />
      <main className="relative z-10">
        <div className="sticky top-0 px-4 pb-4 pt-6">
          <h1 className="mb-2 text-3xl font-black tracking-tight text-white">Updates</h1>
          <p className="text-[15px] font-medium text-gray-400">Latest activity from the tournament.</p>
        </div>

        <div className="px-4 pt-4">
          {mysteryMode && (
            <div className="mb-4 rounded-[24px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(28,28,30,0.8),rgba(28,28,30,0.65))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white/70">
                  <EyeOff size={18} />
                </span>
                <div>
                  <h2 className="text-[15px] font-bold">Standings reveal mode is on</h2>
                  <p className="mt-1 text-[13px] leading-5 text-white/45">
                    Result updates are hidden until the reveal, but schedule updates can still appear here.
                  </p>
                </div>
              </div>
            </div>
          )}

          {updates.length === 0 ? (
            <div className="flex h-[30vh] w-full flex-col items-center justify-center text-center">
              <Bell className="mb-4 h-8 w-8 text-white/20" />
              <p className="font-medium text-gray-400">No updates yet.</p>
            </div>
          ) : (
            <div className="flex flex-col overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#1c1c1e]">
              {updates.map((update, index) => {
                const style = toneStyles[update.tone];

                return (
                  <div
                    key={update.id}
                    className={`relative px-4 py-4 ${index === updates.length - 1 ? "" : "border-b border-white/[0.08]"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
                        <h2 className={`truncate text-[14px] font-bold leading-5 ${style.label}`}>{update.title}</h2>
                      </div>
                      <span className="shrink-0 text-[11px] font-semibold text-white/35">{formatRelativeTime(update.timestamp)}</span>
                    </div>
                    <div className="mt-1 pl-3.5">
                      <p className="text-[13px] font-medium leading-5 text-white/72">{update.description}</p>
                      <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/32">{update.meta}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

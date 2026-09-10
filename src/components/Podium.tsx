"use client";

import Image from "next/image";
import Link from "next/link";
import { teamNameToColor } from "@/utils/colors";

interface LeaderboardRow {
  id: string;
  name: string;
  abbreviation: string | null;
  image_url?: string;
  mascot_url?: string | null;
  total_points: number;
  golds: number;
  silvers: number;
  bronzes: number;
}

interface PodiumProps {
  leaderboard: LeaderboardRow[];
  mysteryMode?: boolean;
}

type PodiumMeta = {
  rank: number;
  rankLabel: string;
  medalColor: string;
  platformHeight: string;
  imageSize: string;
};

const PODIUM_ORDER = [1, 0, 2];
const PODIUM_META: PodiumMeta[] = [
  {
    rank: 2,
    rankLabel: "Second",
    medalColor: "#aeb4bf",
    platformHeight: "h-[104px]",
    imageSize: "h-[76px] w-[76px]",
  },
  {
    rank: 1,
    rankLabel: "Champion",
    medalColor: "#f5c542",
    platformHeight: "h-[142px]",
    imageSize: "h-[104px] w-[104px]",
  },
  {
    rank: 3,
    rankLabel: "Third",
    medalColor: "#c9814e",
    platformHeight: "h-[88px]",
    imageSize: "h-[70px] w-[70px]",
  },
];

export default function ApplePodium({ leaderboard, mysteryMode }: PodiumProps) {
  const top3 = PODIUM_ORDER.map((index) => leaderboard[index] ?? null);
  const rest = leaderboard.slice(3);

  return (
    <div className="w-full">
      <section className="px-3" aria-label="Top three teams">
        <div className="relative mx-auto max-w-md px-2 pt-7">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {top3.map((team, column) => {
              const color = team ? teamNameToColor(team.name) : "#8e8e93";
              const positions = ["16%", "50%", "84%"];

              return (
                <div
                  key={team?.id ?? column}
                  className="absolute inset-y-0 w-[46%] -translate-x-1/2 opacity-35 blur-3xl dark:opacity-45"
                  style={{
                    left: positions[column],
                    background: `linear-gradient(to bottom, transparent 8%, ${color}66 48%, ${color}33 100%)`,
                  }}
                />
              );
            })}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/30 to-transparent dark:from-black/20" />
          </div>

          <div className="relative z-10 grid grid-cols-[1fr_1.08fr_1fr] items-end gap-2">
            {top3.map((team, column) => {
              const meta = PODIUM_META[column];
              const color = team ? teamNameToColor(team.name) : "#8e8e93";
              const imageUrl = team?.image_url || team?.mascot_url;
              const revealDelay = column === 1 ? 0.04 : column === 0 ? 0.13 : 0.2;

              return (
                <Link
                  key={team?.id ?? column}
                  href={team ? `/teams/${team.id}` : "#"}
                  aria-label={
                    team
                      ? `${meta.rankLabel}: ${team.name}, ${mysteryMode ? "points hidden" : `${team.total_points} points`}`
                      : `${meta.rankLabel}: to be decided`
                  }
                  className={`group flex min-w-0 flex-col items-center ${team ? "cursor-pointer" : "pointer-events-none"}`}
                >
                  <div
                    className="podium-team-reveal flex h-[190px] w-full flex-col items-center justify-end"
                    style={{ animationDelay: `${revealDelay}s` }}
                  >
                    <div className={`relative ${meta.imageSize} shrink-0`}>
                      <div
                        aria-hidden="true"
                        className="absolute inset-[12%] scale-110 rounded-full opacity-30 blur-xl transition-opacity duration-300 group-hover:opacity-50"
                        style={{ backgroundColor: color }}
                      />
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={team?.name ?? "Team"}
                          fill
                          sizes={column === 1 ? "104px" : "76px"}
                          priority={column === 1}
                          className="relative object-contain transition-transform duration-300 group-hover:-translate-y-0.5"
                          style={{
                            filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.52)) drop-shadow(0 10px 16px rgba(0,0,0,0.28))",
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full border border-black/10 bg-white/50 text-[11px] font-black text-gray-500 dark:border-white/10 dark:bg-white/10 dark:text-gray-300">
                          {team?.abbreviation?.slice(0, 3) ?? "?"}
                        </div>
                      )}
                      <div
                        className="absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-full border border-white/80 bg-white/90 px-1 text-[13px] font-black text-gray-950 shadow-[0_5px_16px_rgba(0,0,0,0.22)] dark:border-white/30 dark:bg-[#1c1c1e] dark:text-white"
                        style={{ boxShadow: `0 0 0 2px ${meta.medalColor}55, 0 6px 18px rgba(0,0,0,0.24)` }}
                      >
                        {meta.rank}
                      </div>
                    </div>

                    <div className="mt-3 flex min-h-[63px] w-full flex-col items-center text-center">
                      <div className="line-clamp-2 max-w-[116px] text-[12px] font-extrabold leading-[1.1] text-gray-950 dark:text-white">
                        {team?.name ?? "To be decided"}
                      </div>
                      <div className="mt-1.5 text-[10px] font-semibold uppercase text-gray-500 dark:text-gray-400">
                        {team?.abbreviation ?? "TBD"}
                      </div>
                      <div className="mt-0.5 flex items-baseline gap-1 tabular-nums">
                        <span className="text-[15px] font-black text-gray-950 dark:text-white">
                          {team ? (mysteryMode ? "???" : team.total_points) : "--"}
                        </span>
                        <span className="text-[8px] font-bold uppercase text-gray-400 dark:text-gray-500">pts</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`podium-platform-rise relative w-full origin-bottom overflow-hidden rounded-t-[18px] border-x border-t ${meta.platformHeight} backdrop-blur-2xl`}
                    style={{
                      animationDelay: `${revealDelay}s`,
                      borderColor: `${color}70`,
                      background: `linear-gradient(180deg, ${color}38 0%, rgba(255,255,255,0.13) 52%, rgba(255,255,255,0.06) 100%)`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 -12px 35px ${color}1f`,
                    }}
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-px"
                      style={{ backgroundColor: meta.medalColor }}
                    />
                    <div className="flex h-full flex-col items-center justify-center">
                      <span className="text-[11px] font-black uppercase" style={{ color: meta.medalColor }}>
                        {meta.rankLabel}
                      </span>
                      <span className="mt-1 text-[30px] font-black leading-none text-gray-950/85 dark:text-white/90">
                        {meta.rank}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {rest.length > 0 && (
        <section className="mt-5 px-4" aria-label="Remaining standings">
          <div className="mb-2 flex items-center px-3 text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">
            <div className="w-6 text-center">#</div>
            <div className="ml-3 flex-1">Team</div>
            <div className="flex shrink-0 gap-3">
              <div className="w-5 text-center">G</div>
              <div className="w-5 text-center">S</div>
              <div className="w-5 text-center">B</div>
              <div className="w-10 text-right">Pts</div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[20px] border border-white/80 bg-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/[0.14] dark:bg-white/[0.06] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_18px_45px_rgba(0,0,0,0.28)]">
            {rest.map((department, index) => {
              const color = teamNameToColor(department.name);

              return (
                <div
                  key={department.id}
                  className="podium-standing-reveal"
                  style={{ animationDelay: `${0.04 * index}s` }}
                >
                  <Link
                    href={`/teams/${department.id}`}
                    className={`relative flex items-center px-3 py-2.5 transition-colors hover:bg-white/55 dark:hover:bg-white/[0.08] ${
                      index !== rest.length - 1 ? "border-b border-black/[0.05] dark:border-white/[0.07]" : ""
                    }`}
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-y-2 left-0 w-0.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <div className="w-6 text-center text-[13px] font-black text-gray-400 dark:text-gray-500">
                      {index + 4}
                    </div>

                    <div className="relative mx-2.5 h-7 w-7 shrink-0">
                      {department.image_url ? (
                        <Image
                          src={department.image_url}
                          alt={department.name}
                          fill
                          sizes="28px"
                          className="object-contain"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-black/[0.06] text-[9px] font-bold text-gray-500 dark:bg-white/10 dark:text-gray-300">
                          {department.abbreviation?.slice(0, 2) ?? "??"}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 pr-2">
                      <div className="truncate text-[14px] font-bold text-gray-950 dark:text-white">
                        {department.name}
                      </div>
                      {department.abbreviation && (
                        <div className="text-[9px] font-medium uppercase text-gray-500 dark:text-gray-400">
                          {department.abbreviation}
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-3 text-[13px] tabular-nums">
                      <div className="w-5 text-center font-medium text-yellow-600 dark:text-yellow-500">{department.golds}</div>
                      <div className="w-5 text-center font-medium text-gray-500 dark:text-gray-400">{department.silvers}</div>
                      <div className="w-5 text-center font-medium text-orange-600 dark:text-orange-500">{department.bronzes}</div>
                      <div className="w-10 text-right font-black text-gray-700 dark:text-gray-300">
                        {mysteryMode ? "???" : department.total_points}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

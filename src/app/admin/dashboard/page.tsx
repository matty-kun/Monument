"use client";

import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Flag,
  LogOut,
  Medal,
  Tags,
} from "lucide-react";
import BouncingBallsLoader from "@/components/BouncingBallsLoader";
import EmptyTournamentState from "@/components/EmptyTournamentState";
import { type Tournament, useTournament } from "@/components/AdminTournamentProvider";
import { useDashboardViewModel } from "@/features/admin/dashboard/viewModels/useDashboardViewModel";
import { formatTime } from "@/lib/utils";

const medalStyles: Record<string, string> = {
  gold: "bg-[#fff4c5] text-[#7a5a00] dark:bg-[#d6b14e]/15 dark:text-[#f0ce70]",
  silver: "bg-[#edf0ef] text-[#59615d] dark:bg-white/10 dark:text-white/65",
  bronze: "bg-[#f3e4d8] text-[#83502f] dark:bg-[#b87549]/15 dark:text-[#dda67f]",
};

export default function AdminDashboardPage() {
  const { selectedTournament } = useTournament();
  const {
    role,
    loading,
    loadingCard,
    recentSchedules,
    standings,
    recentResults,
    teamsData,
    stats,
    handleCardClick,
    handleLogout,
  } = useDashboardViewModel({ selectedTournament });

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><BouncingBallsLoader /></div>;
  }

  if (!selectedTournament) return <EmptyTournamentState />;

  return (
    <DashboardView
      selectedTournament={selectedTournament}
      role={role}
      loadingCard={loadingCard}
      recentSchedules={recentSchedules}
      standings={standings}
      recentResults={recentResults}
      teamsData={teamsData}
      stats={stats}
      handleCardClick={handleCardClick}
      handleLogout={handleLogout}
    />
  );
}

interface DashboardViewProps {
  selectedTournament: Tournament;
  role: string | null;
  loadingCard: string;
  recentSchedules: any[];
  standings: any[];
  recentResults: any[];
  teamsData: any[];
  stats: { teams: number; events: number; results: number; categories: number };
  handleCardClick: (href: string) => void;
  handleLogout: () => void | Promise<void>;
}

export function DashboardView({
  selectedTournament,
  role,
  loadingCard,
  recentSchedules,
  standings,
  recentResults,
  teamsData,
  stats,
  handleCardClick,
  handleLogout,
}: DashboardViewProps) {
  const quickActions = [
    { href: "/admin/results", label: "Record results", detail: "Medals and points", icon: Medal },
    { href: "/admin/schedule", label: "Update schedule", detail: "Times and venues", icon: CalendarDays },
    { href: "/admin/events", label: "Manage events", detail: "Entries and details", icon: Flag },
  ];

  return (
    <div className="admin-dashboard animate-fadeIn space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b border-[#dfe3e1] pb-5 dark:border-white/10 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 font-mono text-[10px] text-[#78807b] dark:text-white/40">
            <span className={`h-1.5 w-1.5 rounded-full ${selectedTournament.is_active ? "bg-monument-primary" : "bg-[#9ba19e]"}`} />
            {selectedTournament.is_active ? "ACTIVE TOURNAMENT" : "TOURNAMENT WORKSPACE"}
          </div>
          <h1 className="truncate text-2xl font-semibold text-[#151816] dark:text-white">{selectedTournament.name}</h1>
          <p className="mt-1 text-sm text-[#737a76] dark:text-white/45">Operations overview and recent tournament activity</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs capitalize text-[#7a817d] dark:text-white/40 sm:inline">{role?.replace("_", " ")}</span>
          <button type="button" onClick={handleLogout} className="admin-secondary-button text-red-600 dark:text-red-400" title="Sign out">
            <LogOut size={15} />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      <section className="admin-panel overflow-hidden" aria-label="Tournament totals">
        <div className="grid grid-cols-2 divide-x divide-y divide-[#e2e5e3] dark:divide-white/10 sm:grid-cols-4 sm:divide-y-0">
          <StatBlock label="Teams" value={stats.teams} icon={Building2} />
          <StatBlock label="Events" value={stats.events} icon={Flag} />
          <StatBlock label="Results" value={stats.results} icon={Medal} />
          <StatBlock label="Categories" value={stats.categories} icon={Tags} />
        </div>
      </section>

      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="admin-section-title">Quick actions</h2>
          <span className="font-mono text-[10px] text-[#8a908d] dark:text-white/30">COMMON TASKS</span>
        </div>
        <div className="grid overflow-hidden rounded-lg border border-[#dfe3e1] bg-white dark:border-white/10 dark:bg-[#131614] sm:grid-cols-3 sm:divide-x sm:divide-[#e2e5e3] sm:dark:divide-white/10">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const isNavigating = loadingCard === action.href;

            return (
              <button
                type="button"
                key={action.href}
                onClick={() => handleCardClick(action.href)}
                disabled={isNavigating}
                className="group flex min-h-20 items-center gap-3 border-b border-[#e2e5e3] px-4 text-left transition-colors last:border-b-0 hover:bg-[#f7f8f7] disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/[0.035] sm:border-b-0"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#dfe3e1] bg-[#f6f8f7] text-[#4f5752] group-hover:border-monument-primary/40 group-hover:text-monument-primary dark:border-white/10 dark:bg-white/[0.035] dark:text-white/55">
                  <Icon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-[#202421] dark:text-white/85">{action.label}</span>
                  <span className="block text-xs text-[#818783] dark:text-white/35">{action.detail}</span>
                </span>
                <ArrowUpRight size={14} className="shrink-0 text-[#a1a6a3] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-monument-primary" />
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.8fr)]">
        <section className="admin-panel overflow-hidden">
          <div className="admin-panel-header">
            <div>
              <h2 className="admin-section-title">Upcoming and live</h2>
              <p className="admin-section-description">The next scheduled tournament activity</p>
            </div>
            <CalendarDays size={16} className="text-[#89908c] dark:text-white/35" />
          </div>

          <div className="divide-y divide-[#e7e9e8] dark:divide-white/10">
            {recentSchedules.length > 0 ? recentSchedules.map((schedule: any) => (
              <div key={schedule.id} className="grid gap-3 px-4 py-3.5 transition-colors hover:bg-[#fafbfa] dark:hover:bg-white/[0.02] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#edf3f0] text-base dark:bg-monument-primary/10">{schedule.events?.icon || "🏅"}</span>
                  <div className="min-w-0">
                    <h3 className="truncate text-[13px] font-semibold text-[#202421] dark:text-white/85">{schedule.events?.name || "Unknown event"}</h3>
                    <p className="mt-0.5 truncate text-xs text-[#7a817d] dark:text-white/40">{schedule.departments?.join(" vs ") || "Participants to be announced"}</p>
                  </div>
                </div>
                <div className="pl-11 text-left sm:pl-0 sm:text-right">
                  <p className="font-mono text-[11px] text-[#414743] dark:text-white/65">{schedule.date}</p>
                  <p className="mt-0.5 text-[11px] text-[#888e8b] dark:text-white/35">{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)} · {schedule.venues?.name || "TBA"}</p>
                </div>
              </div>
            )) : <EmptyRow label="No upcoming schedules" />}
          </div>
        </section>

        <section className="admin-panel overflow-hidden">
          <div className="admin-panel-header">
            <div>
              <h2 className="admin-section-title">Standings</h2>
              <p className="admin-section-description">Current top five teams</p>
            </div>
            <Medal size={16} className="text-[#89908c] dark:text-white/35" />
          </div>

          <div className="divide-y divide-[#e7e9e8] dark:divide-white/10">
            {standings.length > 0 ? standings.map((team: any, index: number) => (
              <div key={team.id || team.department_id} className="flex h-14 items-center gap-3 px-4 sm:px-5">
                <span className="w-5 font-mono text-[11px] text-[#848a87] dark:text-white/35">{String(index + 1).padStart(2, "0")}</span>
                {team.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={team.imageUrl} className="h-7 w-7 shrink-0 object-contain" alt="" />
                ) : (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#edf0ef] text-[9px] font-semibold text-[#626965] dark:bg-white/10 dark:text-white/60">{team.name.slice(0, 2)}</span>
                )}
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#303532] dark:text-white/75">{team.name}</span>
                <span className="font-mono text-xs font-semibold text-[#17694f] dark:text-[#72cbae]">{team.points} pts</span>
              </div>
            )) : <EmptyRow label="No rankings available" />}
          </div>
        </section>
      </div>

      <section className="admin-panel overflow-hidden">
        <div className="admin-panel-header">
          <div>
            <h2 className="admin-section-title">Recent results</h2>
            <p className="admin-section-description">Latest podium entries across all events</p>
          </div>
          <button type="button" onClick={() => handleCardClick("/admin/results")} className="admin-text-button">View all <ArrowUpRight size={13} /></button>
        </div>

        <div>
          <table className="w-full table-fixed border-collapse text-left">
            <thead>
              <tr className="border-b border-[#e7e9e8] dark:border-white/10">
                <th className="admin-table-heading w-24 sm:w-36">Placement</th>
                <th className="admin-table-heading">Event</th>
                <th className="admin-table-heading">Team</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7e9e8] dark:divide-white/10">
              {recentResults.length > 0 ? recentResults.map((result: any) => {
                const teamName = teamsData.find((team: any) => team.department_id === result.department_id)?.name || "Unknown team";
                const medalType = result.medal_type || "bronze";

                return (
                  <tr key={result.id} className="hover:bg-[#fafbfa] dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <span className={`inline-flex min-w-16 items-center justify-center rounded px-2 py-1 text-[10px] font-semibold capitalize ${medalStyles[medalType] || medalStyles.bronze}`}>{medalType}</span>
                    </td>
                    <td className="break-words px-3 py-3 text-[13px] font-medium text-[#303532] dark:text-white/75 sm:px-5">{result.events?.name || "Unknown event"}</td>
                    <td className="break-words px-3 py-3 text-[13px] text-[#737a76] dark:text-white/45 sm:px-5">{teamName}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={3}><EmptyRow label="No results posted yet" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatBlock({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Building2 }) {
  return (
    <div className="flex min-h-24 items-center gap-3 px-4 py-4 sm:px-5">
      <Icon size={16} className="shrink-0 text-[#89908c] dark:text-white/35" />
      <div>
        <p className="text-[11px] text-[#7a817d] dark:text-white/40">{label}</p>
        <p className="mt-0.5 font-mono text-2xl font-semibold leading-none text-[#1c201d] dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return <div className="px-5 py-10 text-center text-xs text-[#8b918e] dark:text-white/35">{label}</div>;
}

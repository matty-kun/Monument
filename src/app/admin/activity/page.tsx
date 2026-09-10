"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import BouncingBallsLoader from "@/components/BouncingBallsLoader";
import EmptyTournamentState from "@/components/EmptyTournamentState";
import { useTournament } from "@/components/AdminTournamentProvider";
import { createClient } from "@/utils/supabase/client";

type ActivityAction = "insert" | "update" | "delete";

interface ResultActivity {
  id: string;
  result_id: string;
  event_name: string | null;
  department_name: string | null;
  medal_type: string | null;
  action: ActivityAction;
  actor_email: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

const actionLabels: Record<ActivityAction, string> = {
  insert: "Assigned",
  update: "Changed",
  delete: "Removed",
};

const actionStyles: Record<ActivityAction, string> = {
  insert: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  update: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  delete: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
};

export default function ResultActivityPage() {
  const { selectedTournament } = useTournament();
  const [supabase] = useState(() => createClient());
  const [activity, setActivity] = useState<ResultActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<"all" | ActivityAction>("all");

  const fetchActivity = useCallback(async (background = false) => {
    if (!selectedTournament) {
      setLoading(false);
      return;
    }

    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const { data, error: queryError } = await supabase
      .from("result_activity_log")
      .select("id, result_id, event_name, department_name, medal_type, action, actor_email, old_data, new_data, created_at")
      .eq("tournament_id", selectedTournament.id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (queryError) {
      setError("The activity log is unavailable. Apply the result audit migration first.");
    } else {
      setActivity((data || []) as ResultActivity[]);
    }

    setLoading(false);
    setRefreshing(false);
  }, [selectedTournament, supabase]);

  useEffect(() => {
    // Initial database synchronization for the selected tournament.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchActivity();
    document.title = "Result Activity | Monument Admin";
  }, [fetchActivity]);

  const visibleActivity = useMemo(
    () => actionFilter === "all" ? activity : activity.filter((entry) => entry.action === actionFilter),
    [actionFilter, activity],
  );

  if (!selectedTournament) return <EmptyTournamentState />;
  if (loading) return <div className="flex h-[60vh] items-center justify-center"><BouncingBallsLoader /></div>;

  return (
    <div className="space-y-5 animate-fadeIn">
      <Breadcrumbs items={[{ href: "/admin/dashboard", label: "Dashboard" }, { label: "Activity log" }]} />

      <header className="flex flex-col justify-between gap-4 border-b border-[#dfe3e1] pb-5 dark:border-white/10 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 font-mono text-[10px] text-[#78807b] dark:text-white/40">
            <ShieldCheck size={12} className="text-monument-primary" />
            APPEND-ONLY RESULT TRAIL
          </div>
          <h1 className="text-2xl font-semibold text-[#151816] dark:text-white">Activity log</h1>
          <p className="mt-1 text-sm text-[#737a76] dark:text-white/45">{selectedTournament.name}</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value as "all" | ActivityAction)}
            className="h-9 rounded-md border border-[#d8dcda] bg-white px-3 text-xs text-[#4f5652] outline-none focus:ring-2 focus:ring-monument-primary/25 dark:border-white/10 dark:bg-white/[0.035] dark:text-white/70"
            aria-label="Filter activity"
          >
            <option value="all">All activity</option>
            <option value="insert">Assigned</option>
            <option value="update">Changed</option>
            <option value="delete">Removed</option>
          </select>
          <button type="button" onClick={() => fetchActivity(true)} className="admin-secondary-button" disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</div>
      ) : (
        <section className="admin-panel overflow-hidden">
          <div className="admin-panel-header">
            <div>
              <h2 className="admin-section-title">Result changes</h2>
              <p className="admin-section-description">{visibleActivity.length} recorded actions</p>
            </div>
          </div>

          {visibleActivity.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-[#858b88] dark:text-white/35">No result activity recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#e7e9e8] dark:border-white/10">
                    <th className="admin-table-heading w-44">Time</th>
                    <th className="admin-table-heading w-56">Administrator</th>
                    <th className="admin-table-heading w-28">Action</th>
                    <th className="admin-table-heading">Event</th>
                    <th className="admin-table-heading">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7e9e8] dark:divide-white/10">
                  {visibleActivity.map((entry) => (
                    <tr key={entry.id} className="hover:bg-[#fafbfa] dark:hover:bg-white/[0.02]">
                      <td className="px-5 py-3 font-mono text-[11px] text-[#6f7672] dark:text-white/45">{formatAuditTime(entry.created_at)}</td>
                      <td className="max-w-56 truncate px-5 py-3 text-[12px] font-medium text-[#303532] dark:text-white/75" title={entry.actor_email || "Database administrator"}>{entry.actor_email || "Database administrator"}</td>
                      <td className="px-5 py-3"><span className={`inline-flex min-w-16 justify-center rounded px-2 py-1 text-[10px] font-semibold ${actionStyles[entry.action]}`}>{actionLabels[entry.action]}</span></td>
                      <td className="px-5 py-3 text-[13px] font-medium text-[#303532] dark:text-white/75">{entry.event_name || "Deleted event"}</td>
                      <td className="px-5 py-3 text-[12px] text-[#737a76] dark:text-white/45">
                        <span className="capitalize">{entry.medal_type || "Result"}</span>
                        <span className="mx-1.5 text-[#b0b5b2]">·</span>
                        {entry.department_name || "No team"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function formatAuditTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

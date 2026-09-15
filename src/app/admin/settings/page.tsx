"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  Database,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import ConfirmModal from "@/components/ConfirmModal";
import { useTournament } from "@/components/AdminTournamentProvider";
import { createClient } from "@/utils/supabase/client";

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#181818]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#269a7a]/10 text-[#269a7a] dark:bg-[#20c997]/10 dark:text-[#33d6a6]">
            <Icon size={18} />
          </span>
          <span className="min-w-0">
            <h2 className="text-[15px] font-semibold text-gray-950 dark:text-white">{title}</h2>
            <p className="mt-1 max-w-2xl text-[13px] leading-5 text-gray-500 dark:text-white/45">{description}</p>
          </span>
        </div>
        {children}
      </div>
    </section>
  );
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const { selectedTournament, activeTournament } = useTournament();
  const tournament = selectedTournament || activeTournament;
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.title = `Settings | ${tournament?.name || "MONUMENT"}`;
  }, [tournament?.name]);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setShowSignOutConfirm(false);
      router.push("/");
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 animate-fadeIn">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Breadcrumbs items={[{ href: "/admin/dashboard", label: "Dashboard" }, { label: "Settings" }]} />
          <h1 className="mt-8 text-4xl font-black tracking-tight text-monument-primary">Settings</h1>
          <p className="mt-2 text-sm font-medium text-gray-500 dark:text-white/45">
            Control the admin experience, safety defaults, and tournament context.
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-white/10 dark:bg-[#181818]">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-white/35">Current context</p>
          <p className="mt-1 font-semibold text-gray-900 dark:text-white">{tournament?.name || "No tournament selected"}</p>
        </div>
      </div>

      <div className="grid gap-4">
        <SettingRow
          icon={isDark ? Moon : Sun}
          title="Appearance"
          description="Switch the admin console between dark and light mode. Public pages stay dark-only."
        >
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#269a7a] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1b7359] active:scale-95"
          >
            {mounted ? (isDark ? <Sun size={16} /> : <Moon size={16} />) : <span className="h-4 w-4" />}
            {isDark ? "Use light mode" : "Use dark mode"}
          </button>
        </SettingRow>

        <SettingRow
          icon={Trophy}
          title="Tournament selection"
          description="The sidebar selector controls which tournament your admin pages are editing. Archived tournaments remain readable but locked."
        >
          <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[12px] font-semibold text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
            Managed in sidebar
          </span>
        </SettingRow>

        <SettingRow
          icon={ShieldCheck}
          title="Privileged actions"
          description="Result assignment, team management, and tournament changes are limited to admin roles and checked before saving."
        >
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#269a7a]/10 px-3 py-2 text-[12px] font-bold text-[#269a7a] dark:text-[#33d6a6]">
            <CheckCircle2 size={14} /> Enabled
          </span>
        </SettingRow>

        <SettingRow
          icon={ClipboardList}
          title="Activity log"
          description="Result changes are tracked with the admin who performed the action so SSG can review suspicious updates."
        >
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#269a7a]/10 px-3 py-2 text-[12px] font-bold text-[#269a7a] dark:text-[#33d6a6]">
            <CheckCircle2 size={14} /> Recording
          </span>
        </SettingRow>

        <SettingRow
          icon={Database}
          title="Database security"
          description="Public voting is protected by database rules and device-level vote limits. Sensitive admin writes stay server-controlled."
        >
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#269a7a]/10 px-3 py-2 text-[12px] font-bold text-[#269a7a] dark:text-[#33d6a6]">
            <CheckCircle2 size={14} /> Active
          </span>
        </SettingRow>

        <SettingRow
          icon={Bell}
          title="Operational reminders"
          description="Before event day, check schedules without venues, results without winners, and tournaments left in Mystery Mode."
        >
          <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[12px] font-semibold text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
            Manual review
          </span>
        </SettingRow>

        <SettingRow
          icon={LogOut}
          title="Account session"
          description="Sign out of the admin console on this device. You will need to sign in again to manage tournaments."
        >
          <button
            type="button"
            onClick={() => setShowSignOutConfirm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FF453A]/10 px-4 py-2.5 text-sm font-bold text-[#FF453A] transition hover:bg-[#FF453A]/20 active:scale-95"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </SettingRow>
      </div>

      <ConfirmModal
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={handleSignOut}
        title="Sign Out"
        message="Are you sure you want to sign out of the admin console?"
        confirmLabel="Sign out"
        variant="destructive"
      />
    </div>
  );
}

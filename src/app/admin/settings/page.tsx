'use client';

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { EyeOff, Eye, Wand2, ShieldAlert } from "lucide-react";
import { toggleMysteryMode } from "@/utils/settings/actions";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [mysteryMode, setMysteryMode] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Settings | CITE FEST 2026 Management";
    async function fetchSetting() {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "mystery_mode")
        .single();

      if (error) {
        console.error("Error fetching mystery_mode:", error);
        setMysteryMode(false);
      } else {
        setMysteryMode(data?.value === "true");
      }
      setLoading(false);
    }
    fetchSetting();
  }, [supabase]);

  const handleToggle = async () => {
    if (mysteryMode === null) return;
    setSaving(true);
    setFeedback(null);
    const nextValue = !mysteryMode;
    const result = await toggleMysteryMode(nextValue);
    if (result.success) {
      setMysteryMode(nextValue);
      setFeedback(nextValue ? "Mystery Mode is now ON. Standings are hidden from the public." : "Mystery Mode is now OFF. Standings are visible to everyone.");
    } else {
      setFeedback(`Error: ${result.error}`);
    }
    setSaving(false);
    setTimeout(() => setFeedback(null), 5000);
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-monument-primary uppercase tracking-tight leading-none mb-2">
          Settings
        </h1>
        <p className="text-sm text-gray-500 font-medium tracking-wide">
          Global configuration for CITE FEST 2026
        </p>
      </div>

      {/* Mystery Mode Card */}
      <div className="max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-500 ${mysteryMode ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
              {mysteryMode
                ? <EyeOff size={24} className="text-monument-primary" />
                : <Eye size={24} className="text-gray-400" />
              }
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-800 dark:text-white tracking-tight flex items-center gap-2">
                Mystery Mode
                <Wand2 size={16} className="text-monument-primary" />
              </h2>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Leaderboard Visibility</p>
            </div>
          </div>

          {/* Card Body */}
          <div className="px-8 py-6 flex flex-col gap-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              When <span className="font-black text-monument-primary">Mystery Mode</span> is <span className="font-black">ON</span>, the public leaderboard will hide all scores, medal counts, and rankings — showing only a teaser message. This lets you record results in the background without spoiling the grand reveal at the culmination ceremony.
            </p>

            <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <ShieldAlert size={18} className={`transition-colors ${mysteryMode ? 'text-violet-500' : 'text-gray-300'}`} />
                <span className="text-sm font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                  {loading ? 'Loading...' : mysteryMode ? 'Mystery Mode: ON' : 'Mystery Mode: OFF'}
                </span>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={handleToggle}
                disabled={loading || saving || mysteryMode === null}
                className="relative w-14 h-7 rounded-full transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-monument-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: mysteryMode ? 'rgb(139, 92, 246)' : 'rgb(209, 213, 219)' }}
                aria-label="Toggle Mystery Mode"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-500 flex items-center justify-center ${mysteryMode ? 'translate-x-7' : 'translate-x-0'}`}
                >
                  {saving && (
                    <span className="w-3 h-3 border-2 border-monument-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </span>
              </button>
            </div>

            {/* Status Indicator */}
            <div className={`rounded-2xl px-5 py-4 text-sm font-semibold transition-all duration-500 ${mysteryMode
              ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
              : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
              }`}>
              {loading ? (
                <span className="text-gray-400">Fetching current setting...</span>
              ) : mysteryMode ? (
                <span>🔮 Standings are currently <strong>hidden</strong> from the public. Flip the switch at the culmination to reveal!</span>
              ) : (
                <span>✅ Standings are <strong>visible</strong> to the public in real-time.</span>
              )}
            </div>

            {/* Feedback Toast */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="rounded-xl px-4 py-3 text-xs font-bold bg-gray-800 dark:bg-gray-700 text-white shadow-xl"
                >
                  {feedback}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

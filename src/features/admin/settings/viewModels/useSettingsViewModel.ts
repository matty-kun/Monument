import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { toggleMysteryMode } from "@/utils/settings/actions";
import { useTournament } from "@/components/AdminTournamentProvider";

export const useSettingsViewModel = () => {
  const supabase = createClient();
  const { selectedTournament, activeTournament } = useTournament();
  const tournament = selectedTournament || activeTournament;
  const [mysteryMode, setMysteryMode] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Settings | ${tournament?.name || "MONUMENT"}`;
    async function fetchSetting() {
      if (!tournament) {
        setMysteryMode(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("tournaments")
        .select("mystery_mode")
        .eq("id", tournament.id)
        .single();

      if (error) {
        console.error("Error fetching mystery_mode:", error);
        setMysteryMode(false);
      } else {
        setMysteryMode(data?.mystery_mode === true);
      }
      setLoading(false);
    }
    fetchSetting();
  }, [supabase, tournament]);

  const handleToggle = useCallback(async () => {
    if (mysteryMode === null || !tournament) return;
    setSaving(true);
    setFeedback(null);
    const nextValue = !mysteryMode;
    const result = await toggleMysteryMode(tournament.id, nextValue);
    if (result.success) {
      setMysteryMode(nextValue);
      setFeedback(nextValue ? "Mystery Mode is now ON. Standings are hidden from the public." : "Mystery Mode is now OFF. Standings are visible to everyone.");
    } else {
      setFeedback(`Error: ${result.error}`);
    }
    setSaving(false);
    setTimeout(() => setFeedback(null), 5000);
  }, [mysteryMode, tournament]);

  return {
    mysteryMode,
    loading,
    saving,
    feedback,
    handleToggle,
    tournamentName: tournament?.name || null,
  };
};

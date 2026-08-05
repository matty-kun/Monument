import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { toggleMysteryMode } from "@/utils/settings/actions";

export const useSettingsViewModel = () => {
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

  const handleToggle = useCallback(async () => {
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
  }, [mysteryMode]);

  return {
    mysteryMode,
    loading,
    saving,
    feedback,
    handleToggle,
  };
};

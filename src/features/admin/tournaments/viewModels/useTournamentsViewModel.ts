import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { AdminTournament } from "../models/tournamentTypes";

export const useTournamentsViewModel = () => {
  const supabase = createClient();
  const [localTournaments, setLocalTournaments] = useState<AdminTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // New tournament form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  
  // Archive Modal
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [tournamentToArchive, setTournamentToArchive] = useState<string | null>(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  async function fetchTournaments() {
    setLoading(true);
    const { data, error } = await supabase.from("tournaments").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      setLocalTournaments(data);
    }
    setLoading(false);
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const isFirst = localTournaments.length === 0;

    const { data, error } = await supabase.from("tournaments").insert([
      { name: newName, slug: newSlug, is_active: isFirst }
    ]).select();

    if (!error && data) {
      setLocalTournaments([data[0], ...localTournaments]);
      setNewName("");
      setNewSlug("");
      setShowNewForm(false);
      window.location.reload(); 
    } else {
      alert("Error creating tournament. Ensure slug is unique.");
    }
    setIsSaving(false);
  };

  const handleSetActive = async (id: string) => {
    setIsSaving(true);
    await supabase.from("tournaments").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000");
    const { error } = await supabase.from("tournaments").update({ is_active: true }).eq("id", id);
    
    if (!error) {
       window.location.reload();
    }
    setIsSaving(false);
  };

  const handleToggleMysteryMode = async (id: string, currentValue: boolean) => {
    const { error } = await supabase.from("tournaments").update({ mystery_mode: !currentValue }).eq("id", id);
    if (!error) {
      setLocalTournaments(localTournaments.map(t => t.id === id ? { ...t, mystery_mode: !currentValue } : t));
    }
  };

  const handleConfirmArchive = async () => {
    if (!tournamentToArchive) return;
    setIsSaving(true);
    
    const { error } = await supabase
      .from("tournaments")
      .update({ is_archived: true, is_active: false })
      .eq("id", tournamentToArchive);
      
    if (!error) {
       localStorage.removeItem("selected_tournament_id");
       window.location.reload();
    } else {
       alert("Failed to archive tournament.");
    }
    
    setIsSaving(false);
    setShowArchiveModal(false);
    setTournamentToArchive(null);
  };

  return {
    localTournaments,
    loading,
    isSaving,
    showNewForm,
    setShowNewForm,
    newName,
    setNewName,
    newSlug,
    setNewSlug,
    showArchiveModal,
    setShowArchiveModal,
    tournamentToArchive,
    setTournamentToArchive,
    handleCreate,
    handleSetActive,
    handleToggleMysteryMode,
    handleConfirmArchive,
  };
};

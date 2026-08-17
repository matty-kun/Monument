"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export interface Tournament {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  mystery_mode: boolean;
  is_archived: boolean;
}

interface TournamentContextType {
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  setSelectedTournament: (t: Tournament | null) => void;
  activeTournament: Tournament | null;
  loading: boolean;
}

const TournamentContext = createContext<TournamentContextType>({
  tournaments: [],
  selectedTournament: null,
  setSelectedTournament: () => {},
  activeTournament: null,
  loading: true,
});

export const useTournament = () => useContext(TournamentContext);

export default function AdminTournamentProvider({ children }: { children: React.ReactNode }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchTournaments() {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setTournaments(data);
        const active = data.find(t => t.is_active) || null;
        setActiveTournament(active);

        // Check local storage for previously selected
        const storedId = localStorage.getItem("selected_tournament_id");
        if (storedId) {
          const found = data.find(t => t.id === storedId);
          if (found) {
            setSelectedTournament(found);
          }
        }
      }
      setLoading(false);
    }
    fetchTournaments();
  }, [supabase]);

  const handleSelectTournament = (t: Tournament | null) => {
    setSelectedTournament(t);
    if (t) {
      localStorage.setItem("selected_tournament_id", t.id);
    } else {
      localStorage.removeItem("selected_tournament_id");
    }
  };

  return (
    <TournamentContext.Provider
      value={{
        tournaments,
        selectedTournament,
        setSelectedTournament: handleSelectTournament,
        activeTournament,
        loading
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

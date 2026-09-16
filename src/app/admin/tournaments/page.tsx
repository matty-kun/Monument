"use client";

import { useState } from "react";
import { Trophy, Plus, CheckCircle, Archive } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import { useTournamentsViewModel } from "@/features/admin/tournaments/viewModels/useTournamentsViewModel";

import Loading from "@/components/loading";

export default function AdminTournamentsPage() {
  const [mysteryConfirmation, setMysteryConfirmation] = useState<{
    id: string;
    name: string;
    currentValue: boolean;
  } | null>(null);
  const {
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
    handleUnarchive
  } = useTournamentsViewModel();

  if (loading) return <Loading />;

  const handleConfirmMysteryMode = () => {
    if (!mysteryConfirmation) return;
    handleToggleMysteryMode(mysteryConfirmation.id, mysteryConfirmation.currentValue);
    setMysteryConfirmation(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-monument-primary uppercase tracking-tight">Tournaments</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Manage seasons and archives</p>
        </div>
        <button 
          onClick={() => setShowNewForm(!showNewForm)}
          className="flex items-center gap-2 rounded-lg bg-[#269a7a] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#1b7359] active:scale-95"
        >
          <Plus size={18} /> New Tournament
        </button>
      </div>

      {showNewForm && (
        <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">Create New Tournament</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Tournament Name</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                  }}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-monument-primary outline-none"
                  placeholder="e.g. SIDLAK 2026"
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">URL Slug</label>
                <input 
                  type="text" 
                  value={newSlug} 
                  onChange={(e) => setNewSlug(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-monument-primary outline-none font-mono"
                  placeholder="e.g. sidlak-2026"
                  required 
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowNewForm(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all">Cancel</button>
              <button type="submit" disabled={isSaving} className="rounded-lg bg-[#269a7a] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#1b7359] disabled:opacity-50">
                {isSaving ? 'Creating...' : 'Create Tournament'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {localTournaments.map(tournament => (
          <div key={tournament.id} className={`p-6 bg-white dark:bg-[#1c1c1e] rounded-2xl border-2 transition-all ${tournament.is_active ? 'border-monument-primary shadow-lg shadow-monument-primary/10' : 'border-gray-200 dark:border-white/5'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tournament.is_active ? 'bg-monument-primary/10 text-monument-primary' : tournament.is_archived ? 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/40 border border-gray-200 dark:border-white/5' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/40'}`}>
                  {tournament.is_archived ? <Archive size={24} /> : <Trophy size={24} />}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className={`text-xl font-black ${tournament.is_archived ? 'text-gray-500 dark:text-white/40 line-through decoration-2' : 'text-gray-900 dark:text-white'}`}>{tournament.name}</h3>
                    {tournament.is_active && (
                      <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md flex items-center gap-1">
                        <CheckCircle size={12} /> Active
                      </span>
                    )}
                    {tournament.is_archived && (
                      <span className="bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/60 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md flex items-center gap-1">
                        <Archive size={12} /> Archived
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-1">/{tournament.slug}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                <button 
                  onClick={() => setMysteryConfirmation({
                    id: tournament.id,
                    name: tournament.name,
                    currentValue: tournament.mystery_mode,
                  })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${tournament.mystery_mode ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-gray-50 text-gray-500 border border-gray-200 dark:bg-white/5 dark:border-white/5 dark:text-white/60'}`}
                >
                  Mystery Mode: {tournament.mystery_mode ? 'ON' : 'OFF'}
                </button>
                
                {!tournament.is_active && !tournament.is_archived && (
                  <button 
                    onClick={() => handleSetActive(tournament.id)}
                    disabled={isSaving}
                    className="px-4 py-2 bg-gray-50 dark:bg-white/5 hover:bg-[#269a7a] dark:hover:bg-[#269a7a] hover:text-white dark:hover:text-white text-gray-600 dark:text-white/60 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border border-gray-200 dark:border-white/5"
                  >
                    Set Active
                  </button>
                )}
                
                {!tournament.is_archived && (
                  <button 
                    onClick={() => {
                      setTournamentToArchive(tournament.id);
                      setShowArchiveModal(true);
                    }}
                    disabled={isSaving}
                    className="px-4 py-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-500 dark:hover:bg-red-500 hover:text-white dark:hover:text-white text-red-600 dark:text-red-400 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border border-red-100 dark:border-red-500/20 disabled:opacity-50"
                  >
                    Archive
                  </button>
                )}
                
                {tournament.is_archived && (
                  <button 
                    onClick={() => handleUnarchive(tournament.id)}
                    disabled={isSaving}
                    className="px-4 py-2 bg-gray-50 dark:bg-white/5 hover:bg-monument-primary hover:text-white text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border border-gray-200 dark:border-white/10 disabled:opacity-50"
                  >
                    Unarchive
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <ConfirmModal 
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        onConfirm={handleConfirmArchive}
        title="Archive Tournament"
        message="Are you sure you want to archive this tournament? This will lock the tournament into Read-Only mode and it will no longer be active."
        confirmLabel="Archive"
        variant="destructive"
      />
      <ConfirmModal
        isOpen={mysteryConfirmation !== null}
        onClose={() => setMysteryConfirmation(null)}
        onConfirm={handleConfirmMysteryMode}
        title={mysteryConfirmation?.currentValue ? "Turn Off Mystery Mode" : "Turn On Mystery Mode"}
        message={
          mysteryConfirmation?.currentValue
            ? `Reveal standings for ${mysteryConfirmation.name}? Public rankings, scores, and medals will become visible.`
            : `Hide standings for ${mysteryConfirmation?.name}? Public rankings, scores, and medals will be concealed until Mystery Mode is turned off.`
        }
        confirmLabel={mysteryConfirmation?.currentValue ? "Reveal standings" : "Hide standings"}
      />
    </div>
  );
}

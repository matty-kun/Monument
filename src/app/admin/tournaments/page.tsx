"use client";

import { Trophy, Plus, Save, Trash2, CheckCircle, Archive } from "lucide-react";
import BouncingBallsLoader from "@/components/BouncingBallsLoader";
import ConfirmModal from "@/components/ConfirmModal";
import { useTournamentsViewModel } from "@/features/admin/tournaments/viewModels/useTournamentsViewModel";

export default function AdminTournamentsPage() {
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
  } = useTournamentsViewModel();

  if (loading) return <div className="flex justify-center items-center h-screen"><BouncingBallsLoader /></div>;

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-monument-primary uppercase tracking-tight">Tournaments</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Manage seasons and archives</p>
        </div>
        <button 
          onClick={() => setShowNewForm(!showNewForm)}
          className="bg-monument-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-violet-700 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> New Tournament
        </button>
      </div>

      {showNewForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-black text-gray-800 dark:text-white mb-4">Create New Tournament</h2>
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
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-monument-primary outline-none"
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
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-monument-primary outline-none font-mono"
                  placeholder="e.g. sidlak-2026"
                  required 
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowNewForm(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all">Cancel</button>
              <button type="submit" disabled={isSaving} className="bg-monument-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-violet-700 transition-all disabled:opacity-50">
                {isSaving ? 'Creating...' : 'Create Tournament'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {localTournaments.map(tournament => (
          <div key={tournament.id} className={`p-6 bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all ${tournament.is_active ? 'border-monument-primary shadow-lg shadow-monument-primary/10' : 'border-gray-100 dark:border-gray-700'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tournament.is_active ? 'bg-monument-primary/10 text-monument-primary' : tournament.is_archived ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                  {tournament.is_archived ? <Archive size={24} /> : <Trophy size={24} />}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className={`text-xl font-black ${tournament.is_archived ? 'text-gray-400 dark:text-gray-500 line-through decoration-2' : 'text-gray-800 dark:text-white'}`}>{tournament.name}</h3>
                    {tournament.is_active && (
                      <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md flex items-center gap-1">
                        <CheckCircle size={12} /> Active
                      </span>
                    )}
                    {tournament.is_archived && (
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md flex items-center gap-1">
                        <Archive size={12} /> Archived
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-1">/{tournament.slug}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                <button 
                  onClick={() => handleToggleMysteryMode(tournament.id, tournament.mystery_mode)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${tournament.mystery_mode ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-gray-50 text-gray-500 border border-gray-200 dark:bg-gray-700 dark:border-gray-600'}`}
                >
                  Mystery Mode: {tournament.mystery_mode ? 'ON' : 'OFF'}
                </button>
                
                {!tournament.is_active && !tournament.is_archived && (
                  <button 
                    onClick={() => handleSetActive(tournament.id)}
                    disabled={isSaving}
                    className="px-4 py-2 bg-gray-50 hover:bg-monument-primary hover:text-white text-gray-600 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border border-gray-200"
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
                    className="px-4 py-2 bg-red-50 hover:bg-red-500 hover:text-white text-red-600 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border border-red-100"
                  >
                    Archive
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
      />
    </div>
  );
}

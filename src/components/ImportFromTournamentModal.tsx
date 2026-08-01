import { motion, AnimatePresence } from "framer-motion";
import { X, History, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Tournament } from "./AdminTournamentProvider";
import BouncingBallsLoader from "./BouncingBallsLoader";

interface ImportFromTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (sourceTournamentId: string) => Promise<void>;
  currentTournamentId: string;
  title: string;
  description: string;
}

export default function ImportFromTournamentModal({
  isOpen,
  onClose,
  onImport,
  currentTournamentId,
  title,
  description,
}: ImportFromTournamentModalProps) {
  const supabase = createClient();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTournaments();
    }
  }, [isOpen]);

  const fetchTournaments = async () => {
    setFetching(true);
    const { data } = await supabase
      .from("tournaments")
      .select("*")
      .neq("id", currentTournamentId)
      .order("start_date", { ascending: false });

    if (data) {
      setTournaments(data);
      if (data.length > 0) setSelectedId(data[0].id);
    }
    setFetching(false);
  };

  const handleImport = async () => {
    if (!selectedId) return;
    setLoading(true);
    await onImport(selectedId);
    setLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl w-full max-w-md relative overflow-hidden"
          >
            <button
              onClick={onClose}
              disabled={loading}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all disabled:opacity-50"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center shrink-0">
                <History size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  {title}
                </h2>
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
              {description}
            </p>

            {fetching ? (
              <div className="py-8 flex justify-center">
                <BouncingBallsLoader />
              </div>
            ) : tournaments.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl text-center border border-gray-100 dark:border-gray-700">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                  No past tournaments found.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    Source Tournament
                  </label>
                  <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    disabled={loading}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-4 text-sm font-bold text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-monument-primary transition-all outline-none appearance-none cursor-pointer"
                  >
                    {tournaments.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleImport}
                  disabled={loading || !selectedId}
                  className="w-full flex items-center justify-center gap-3 bg-monument-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/20 active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    "IMPORTING..."
                  ) : (
                    <>
                      Import <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

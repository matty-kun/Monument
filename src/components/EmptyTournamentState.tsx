import { Trophy } from "lucide-react";

export default function EmptyTournamentState() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4 animate-fadeIn">
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <Trophy className="text-gray-400 dark:text-gray-500" size={40} />
      </div>
      <h2 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tight mb-3">No Active Tournament</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed font-medium">
        There is currently no active season. Please create a new tournament or select a past tournament from the sidebar archive to view historical data.
      </p>
    </div>
  );
}

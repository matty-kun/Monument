import { Trophy } from "lucide-react";

export default function EmptyTournamentState() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4 animate-fadeIn max-w-[1400px]">
      <div className="w-24 h-24 bg-[#1c1c1e] rounded-[24px] flex items-center justify-center mb-6 shadow-lg border border-white/5">
        <Trophy className="text-white/40" size={40} strokeWidth={1.5} />
      </div>
      <h2 className="text-[28px] font-black text-white tracking-tight mb-3">No Tournament Selected</h2>
      <p className="text-[15px] text-white/50 max-w-md mx-auto leading-relaxed font-semibold tracking-wide">
        Please select a tournament from the sidebar dropdown to view its dashboard, or create a new one in the Tournaments tab.
      </p>
    </div>
  );
}

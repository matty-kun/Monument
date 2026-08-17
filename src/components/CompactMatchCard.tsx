"use client";

import Image from "next/image";
import { Schedule } from "@/features/schedule/models/scheduleTypes";
import { Department } from "@/shared/models/tournamentTypes";
import { formatTime } from "@/lib/utils";

interface CompactMatchCardProps {
  schedule: Schedule;
  getDepartmentInfo: (d: Department | string) => Department;
  getDynamicStatus: (s: Schedule) => { status: string; label: string; color: string; icon: string };
  onClick: () => void;
}

export default function CompactMatchCard({ schedule, getDepartmentInfo, getDynamicStatus, onClick }: CompactMatchCardProps) {
  const departments = schedule.departments.map(getDepartmentInfo);
  const { status } = getDynamicStatus(schedule);
  const isMulti = departments.length > 2;
  const isTBA = schedule.start_time.startsWith("00:00");
  const displayStatus = status === 'live' ? 'Live' : status === 'finished' ? 'Final' : (isTBA ? "TBA" : formatTime(schedule.start_time));

  // Sort departments by medal/rank if finished
  if (status === 'finished' && (schedule.events as any)?.results) {
    const getRank = (deptId: string) => {
      const medal = (schedule.events as any).results.find((r: any) => r.department_id === deptId)?.medal_type;
      if (medal === 'gold') return 1;
      if (medal === 'silver') return 2;
      if (medal === 'bronze') return 3;
      return 4; // No medal
    };
    departments.sort((a, b) => getRank(a.id) - getRank(b.id));
  }

  // Multi-team fallback (e.g. 3+ teams like Acoustic Singing)
  if (isMulti || departments.length === 0) {
    const top3 = departments.slice(0, 3);
    return (
      <button 
        onClick={onClick}
        className="w-full flex flex-col py-3 active:bg-gray-50 dark:active:bg-white/5 px-2 transition-colors relative group"
      >
        <div className="absolute top-2 right-3 flex items-center gap-1.5 opacity-90">
          <div className={`w-2 h-2 rounded-full shadow-sm ${status === 'finished' ? 'bg-[#FF5F56]' : status === 'live' ? 'bg-[#27C93F]' : 'bg-[#FFBD2E]'}`} />
          {status !== 'finished' && <span className={`text-[10px] font-bold text-center ${status === 'live' ? 'text-[#27C93F]' : 'text-gray-400 dark:text-gray-500'}`}>{displayStatus}</span>}
        </div>

        <div className="w-full flex flex-col items-center mb-3">
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 text-center">{schedule.events?.name}</span>
        </div>
        {departments.length === 0 ? (
          <div className="text-[12px] text-gray-400 dark:text-gray-500 text-center py-2">Teams TBA</div>
        ) : (
          <div className="flex flex-col items-center w-full mt-1">
            <div className="flex items-start justify-center gap-8 w-full">
              {[1, 0, 2].map((orderIdx) => {
                const d = top3[orderIdx];
                if (!d) return null;
                
                const trueRank = orderIdx + 1;
                const medal = status === 'finished' ? (schedule.events as any)?.results?.find((r: any) => r.department_id === d.id)?.medal_type : null;
                const badge = medal === 'gold' ? '🥇' : medal === 'silver' ? '🥈' : medal === 'bronze' ? '🥉' : null;

                return (
                  <div key={d.id} className={`flex flex-col items-center justify-start w-[64px] ${orderIdx === 0 ? '-mt-2' : ''}`}>
                    <div className={`relative ${orderIdx === 0 ? 'w-12 h-12' : 'w-10 h-10'} mb-2`}>
                      {d.image_url ? (
                        <Image src={d.image_url} alt={d.name} fill sizes={orderIdx === 0 ? "48px" : "40px"} className="object-contain drop-shadow-md" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[11px] font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 text-center px-1 leading-none line-clamp-2 shadow-sm">
                          {d.name.slice(0, 3)}
                        </div>
                      )}
                      
                      {/* Badge / Medal overlay */}
                      {badge ? (
                        <div className="absolute -bottom-1 -right-2 text-[16px] drop-shadow-md">
                          {badge}
                        </div>
                      ) : (
                        <div className="absolute -top-1 -left-2 w-4 h-4 bg-white/80 dark:bg-black/50 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-full flex items-center justify-center text-[8px] font-bold text-gray-700 dark:text-gray-300 shadow-sm">
                          {trueRank}
                        </div>
                      )}
                    </div>
                    
                    <span className={`text-[10px] font-medium text-center leading-tight line-clamp-2 ${orderIdx === 0 ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                      {d.name}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {departments.length > 3 && (
              <div className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-4">
                + {departments.length - 3} more teams (Tap to view)
              </div>
            )}
          </div>
        )}
      </button>
    );
  }

  // Head-to-Head layout (Apple Sports style)
  const d1 = departments[0];
  const d2 = departments[1];
  // Sort out scores
  const score1 = schedule.score_a;
  const score2 = schedule.score_b;
  // If there are results, we can determine the winner to highlight the score, but for now we'll just use white if present.
  const isD1Winner = schedule.winner_id === d1?.id;
  const isD2Winner = schedule.winner_id === d2?.id;

  const renderTeam = (d: Department) => {
    if (!d) return <div className="w-[60px]" />;
    return (
      <div className="flex flex-col items-center justify-start w-[60px]">
        <div className="relative w-8 h-8 mb-1">
          {d.image_url ? (
            <Image src={d.image_url} alt={d.name} fill sizes="32px" className="object-contain" />
          ) : (
            <div className="w-full h-full rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 text-center px-0.5 leading-none line-clamp-2 shadow-sm">
              {d.name.slice(0, 3)}
            </div>
          )}
        </div>
        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 text-center leading-tight line-clamp-2">
          {d.name}
        </span>
      </div>
    );
  };

  const renderScore = (score: number | null | undefined, isWinner: boolean) => {
    if (score === null || score === undefined) return <div className="w-8" />;
    return (
      <div className={`text-3xl font-black tracking-tight ${isWinner ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
        {score}
      </div>
    );
  };

  return (
    <button 
      onClick={onClick}
      className="w-full flex flex-col py-3 active:bg-gray-50 dark:active:bg-white/5 px-2 transition-colors relative group"
    >
      <div className="absolute top-2 right-3 flex items-center gap-1.5 opacity-90">
        <div className={`w-2 h-2 rounded-full shadow-sm ${status === 'finished' ? 'bg-[#FF5F56]' : status === 'live' ? 'bg-[#27C93F]' : 'bg-[#FFBD2E]'}`} />
        {status !== 'finished' && (
          <span className={`text-[10px] font-bold ${status === 'live' ? 'text-[#27C93F]' : 'text-gray-400 dark:text-gray-500'}`}>
            {displayStatus}
          </span>
        )}
      </div>

      {/* Tiny Event Name Header */}
      <div className="w-full text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-10 truncate">
        {schedule.events?.name}
      </div>

      <div className="w-full flex items-center justify-between px-2 mt-1">
        {/* Team 1 Area */}
        <div className="flex items-center gap-4">
          {renderTeam(d1)}
          {renderScore(score1, isD1Winner)}
        </div>

        {/* Status Area (Now Empty, as it is moved to top right) */}
        <div className="flex items-center justify-center min-w-[30px]" />

        {/* Team 2 Area */}
        <div className="flex items-center gap-4 flex-row-reverse">
          {renderTeam(d2)}
          {renderScore(score2, isD2Winner)}
        </div>
      </div>
    </button>
  );
}

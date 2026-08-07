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
        className="w-full flex flex-col py-3 active:bg-white/5 px-2 transition-colors relative"
      >
        <div className="w-full flex justify-between items-center mb-3">
           <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{schedule.events?.name}</span>
           <span className={`text-[12px] font-bold ${status === 'live' ? 'text-red-500' : 'text-white/60'}`}>{displayStatus}</span>
        </div>
        
        {departments.length === 0 ? (
          <div className="text-[12px] text-white/50 text-left py-2">Teams TBA</div>
        ) : (
          <div className="flex flex-col gap-2 w-full">
            {top3.map((d, index) => {
              const medal = status === 'finished' ? (schedule.events as any)?.results?.find((r: any) => r.department_id === d.id)?.medal_type : null;
              const badge = medal === 'gold' ? '🥇' : medal === 'silver' ? '🥈' : medal === 'bronze' ? '🥉' : null;

              return (
                <div key={d.id} className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-bold text-white/30 w-3">{index + 1}</span>
                    <div className="relative w-6 h-6">
                      {d.image_url ? (
                        <Image src={d.image_url} alt={d.name} fill sizes="24px" className="object-contain" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold text-white border border-white/5">
                          {d.abbreviation || d.name.slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <span className="text-[14px] font-bold text-white/90">{d.name}</span>
                  </div>
                  {badge && <span className="text-[16px] drop-shadow-md">{badge}</span>}
                </div>
              );
            })}
            {departments.length > 3 && (
              <div className="text-[11px] text-white/40 text-left mt-1 font-medium">
                + {departments.length - 3} more teams
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
            <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white border border-white/5">
              {d.abbreviation || d.name.slice(0, 2)}
            </div>
          )}
        </div>
        <span className="text-[10px] font-medium text-white/60 text-center leading-tight line-clamp-1">
          {d.abbreviation || d.name}
        </span>
      </div>
    );
  };

  const renderScore = (score: number | null | undefined, isWinner: boolean) => {
    if (score === null || score === undefined) return <div className="w-8" />;
    return (
      <div className={`text-3xl font-black ${isWinner ? 'text-white' : 'text-white/70'}`}>
        {score}
      </div>
    );
  };

  return (
    <button 
      onClick={onClick}
      className="w-full flex flex-col py-3 active:bg-white/5 px-2 transition-colors relative"
    >
      {/* Tiny Event Name Header */}
      <div className="w-full text-center text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
        {schedule.events?.name}
      </div>

      <div className="w-full flex items-center justify-between px-2">
        {/* Team 1 Area */}
        <div className="flex items-center gap-4">
          {renderTeam(d1)}
          {renderScore(score1, isD1Winner)}
        </div>

        {/* Status */}
        <div className={`text-[12px] font-bold ${status === 'live' ? 'text-red-500' : 'text-white/60'}`}>
          {displayStatus}
        </div>

        {/* Team 2 Area */}
        <div className="flex items-center gap-4 flex-row-reverse">
          {renderTeam(d2)}
          {renderScore(score2, isD2Winner)}
        </div>
      </div>
    </button>
  );
}

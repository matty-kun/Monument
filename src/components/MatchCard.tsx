"use client";

import Image from "next/image";
import { Schedule } from "@/features/schedule/models/scheduleTypes";
import { stringToColor } from "@/utils/colors";
import { MapPin, Clock, Users, Trophy, Share, ChevronRight, Download } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { Department } from "@/shared/models/tournamentTypes";
import { useRef, useState, useEffect } from "react";
import * as htmlToImage from 'html-to-image';
import { createClient } from "@/utils/supabase/client";

interface MatchCardProps {
  schedule: Schedule;
  getDepartmentInfo: (d: Department | string) => Department;
  getDynamicStatus: (s: Schedule) => { status: string; label: string; color: string; icon: string };
  getCategoryName?: (c: any) => string | null;
}

export default function MatchCard({ schedule, getDepartmentInfo, getDynamicStatus, getCategoryName }: MatchCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [predictions, setPredictions] = useState<Record<string, number>>({});
  const [hasVoted, setHasVoted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchPredictions = async () => {
      const { data } = await supabase.from('match_predictions').select('department_id').eq('schedule_id', schedule.id);
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((d: any) => {
          counts[d.department_id] = (counts[d.department_id] || 0) + 1;
        });
        setPredictions(counts);
      }
    };
    fetchPredictions();
  }, [schedule.id, supabase]);

  const handleVote = async (deptId: string) => {
    if (hasVoted) return;
    setHasVoted(true);
    // Optimistic UI update
    setPredictions(prev => ({...prev, [deptId]: (prev[deptId] || 0) + 1}));
    
    // Dynamic import of server action to avoid bundling issues
    const { votePrediction } = await import('@/features/schedule/actions/votePrediction');
    const res = await votePrediction(schedule.id, deptId);
    if (!res.success) {
      alert(res.error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBA";
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatFullDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const { status, label, color } = getDynamicStatus(schedule);
  
  // Fetch department info and sort by medal if the event is finished
  let departments = schedule.departments.map(getDepartmentInfo);
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
  
  // Show teams in list format (bottom) if > 2 teams
  const showTeamsInList = departments.length > 2;

  let backgroundStyle = {};
  if (departments.length === 0) {
    backgroundStyle = { background: 'linear-gradient(to bottom, #1a1a2e, #0f0f1a)' };
  } else if (departments.length === 1) {
    const c = stringToColor(departments[0].abbreviation || departments[0].name);
    backgroundStyle = { background: `linear-gradient(to bottom, ${c}, #0f0f1a)` };
  } else if (departments.length === 2) {
    const c1 = stringToColor(departments[0].abbreviation || departments[0].name);
    const c2 = stringToColor(departments[1].abbreviation || departments[1].name);
    backgroundStyle = { background: `linear-gradient(to right, ${c1} 0%, ${c2} 100%)` };
  } else {
    // For 3+ teams, use the first two colors to create a nice blend
    const c1 = stringToColor(departments[0].abbreviation || departments[0].name);
    const c2 = stringToColor(departments[1].abbreviation || departments[1].name);
    backgroundStyle = { background: `linear-gradient(to right, ${c1}, ${c2})` };
  }

  const getMedal = (deptId: string) => {
    if (status !== 'finished' || !(schedule.events as any)?.results) return null;
    return (schedule.events as any).results.find((r: any) => r.department_id === deptId)?.medal_type;
  };

  // Calculate prediction percentages
  const d1Votes = predictions[departments[0]?.id] || 0;
  const d2Votes = predictions[departments[1]?.id] || 0;
  const totalVotes = d1Votes + d2Votes;
  const d1Percentage = totalVotes > 0 ? (d1Votes / totalVotes) * 100 : 50;
  const d2Percentage = totalVotes > 0 ? (d2Votes / totalVotes) * 100 : 50;

  const renderTeamHero = (d: Department, index: number, isWinner: boolean = false, score?: number | null) => {
    const medal = getMedal(d.id);
    const badge = medal === 'gold' ? '🥇' : medal === 'silver' ? '🥈' : medal === 'bronze' ? '🥉' : null;
    
    return (
      <div key={d.id || index} className="flex flex-col items-center flex-1 max-w-[110px] shrink min-w-0 relative">
        <div className="relative w-16 h-16 sm:w-[84px] sm:h-[84px] mb-2 sm:mb-3 shrink-0">
          {badge && (
            <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 text-3xl sm:text-4xl z-20 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
              {badge}
            </div>
          )}
          {d.image_url ? (
            <Image src={d.image_url} alt={d.name} fill sizes="84px" className="object-contain drop-shadow-xl" />
          ) : (
            <div className="w-full h-full rounded-full bg-white/20 flex items-center justify-center text-xl sm:text-2xl font-bold text-white shadow-xl backdrop-blur-sm border border-white/10">
              {d.abbreviation || d.name.slice(0, 3)}
            </div>
          )}
        </div>
      <div className={`text-center font-bold text-[14px] sm:text-[16px] text-white tracking-tight leading-tight w-full whitespace-nowrap overflow-hidden text-ellipsis`}>
        {d.name}
      </div>
      {score !== undefined && score !== null && !showTeamsInList && (
        <div className={`mt-0.5 text-[15px] font-semibold tracking-wide ${isWinner ? 'text-white' : 'text-white/60'}`}>
          {score}
        </div>
      )}
    </div>
  );
};

  const handleShare = async () => {
    if (!cardRef.current || isExporting) return;
    try {
      setIsExporting(true);
      
      // We temporarily hide the share button from the capture by applying a class or using filter, 
      // but simpler is just capture the whole card as is (with the share button). 
      // People often don't mind the share button in the screenshot, but let's hide it.
      const shareBtn = cardRef.current.querySelector('#share-btn') as HTMLElement;
      if (shareBtn) shareBtn.style.display = 'none';

      // Capture DOM
      const dataUrl = await htmlToImage.toJpeg(cardRef.current, { quality: 0.95, backgroundColor: '#000' });
      
      if (shareBtn) shareBtn.style.display = 'flex';

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `match-${schedule.id}.jpg`, { type: 'image/jpeg' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: schedule.events?.name,
          text: `Check out this match!`
        });
      } else {
        // Fallback to download
        const link = document.createElement('a');
        link.download = `match-${schedule.id}.jpg`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Error sharing image', err);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col pt-2 pb-4">
      <div 
        ref={cardRef}
        className="w-full flex-1 bg-[#0a0a0c] rounded-[40px] overflow-hidden flex flex-col relative border border-white/10" 
        style={backgroundStyle}
      >
        {/* Dark overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-[#0a0a0c]/80 to-[#0a0a0c]" />
        
        {/* Scrollable Content */}
        <div className="relative z-10 w-full h-full overflow-y-auto hide-scrollbar flex flex-col">
          
          {/* Top Sheet Handle (Visual only) */}
          <div className="w-10 h-1.5 bg-white/30 rounded-full mx-auto mt-3" />

          {/* Top Bar: Event Name and Share */}
          <div className="flex justify-center items-center relative mt-3 mb-6">
            <span className="text-[13px] font-bold text-white/70 uppercase tracking-widest text-center px-12">
              {schedule.events?.name}
            </span>
            <button 
              id="share-btn"
              onClick={handleShare}
              disabled={isExporting}
              className="absolute right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              {isExporting ? <Clock size={16} className="text-white animate-spin" /> : <Share size={16} className="text-white -ml-0.5" />}
            </button>
          </div>

          {/* Teams & Score/Time Hero Section */}
          <div className="px-2 sm:px-6 mb-8">
            {departments.length === 0 ? (
              <div className="text-center text-white/50 py-10 font-bold">Teams TBA</div>
            ) : showTeamsInList ? (
              // If more than 2 teams, show the clustered teams in the center instead of a single icon
              <div className="flex flex-col items-center justify-center py-2">
                 <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-6">
                   {departments.map((d, i) => {
                     // Since there are many teams, we don't show individual scores here, we just show the team hero
                     return renderTeamHero(d, i, schedule.winner_id === d.id);
                   })}
                 </div>
                 <div className="text-[18px] sm:text-[20px] font-bold text-white tracking-widest uppercase">
                  {status === 'live' ? 'LIVE' : status === 'finished' ? 'FINAL' : (schedule.start_time.startsWith("00:00") ? "TBA" : formatTime(schedule.start_time))}
                 </div>
              </div>
            ) : (
              <div className="flex justify-between items-center px-1 sm:px-2 gap-2">
                {renderTeamHero(departments[0], 0, schedule.winner_id === departments[0].id, schedule.score_a)}
                
                <div className="flex flex-col items-center justify-center shrink-0 min-w-[70px] max-w-[90px]">
                  {status === 'live' ? (
                    <div className="text-[15px] sm:text-[18px] font-bold text-white tracking-wide">LIVE</div>
                  ) : status === 'finished' ? (
                    <div className="text-[15px] sm:text-[18px] font-bold text-white tracking-wide">FINAL</div>
                  ) : (
                    <div className="text-[15px] sm:text-[18px] font-bold text-white tracking-wide">
                      {schedule.start_time.startsWith("00:00") ? "TBA" : formatTime(schedule.start_time)}
                    </div>
                  )}
                </div>

                {renderTeamHero(departments[1], 1, schedule.winner_id === departments[1].id, schedule.score_b)}
              </div>
            )}
          </div>

          {/* Follow/Notify Button */}
          {status !== 'finished' && (
            <div className="flex justify-center mb-8">
              <button className="bg-white/10 hover:bg-white/20 transition-colors rounded-full px-6 py-2 flex items-center gap-2 border border-white/10 backdrop-blur-md">
                <Clock size={16} className="text-white" />
                <span className="text-[15px] font-bold text-white">Notify Me</span>
              </button>
            </div>
          )}

          {/* Info Cards Area */}
          <div className="px-4 flex-1 space-y-4 pb-8">
            
            {/* Match Details Card */}
            <div className="bg-[#1c1c1e]/60 backdrop-blur-xl border border-white/5 rounded-[24px] p-5">
              <div className="text-center text-[15px] font-bold text-white mb-5">
                Match Details
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[15px] text-gray-400">Date</span>
                  <span className="text-[15px] font-medium text-white">{formatDate(schedule.date)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[15px] text-gray-400">Time</span>
                  <span className="text-[15px] font-medium text-white">
                    {schedule.start_time.startsWith("00:00") ? "TBA" : formatTime(schedule.start_time)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[15px] text-gray-400">Venue</span>
                  <span className="text-[15px] font-medium text-white text-right max-w-[150px] truncate">{schedule.venues?.name || 'TBA'}</span>
                </div>
                
                {schedule.events?.category && (
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-[15px] text-gray-400 shrink-0">Category</span>
                    <span className="text-[15px] font-medium text-white max-w-[180px] text-right truncate">
                      {getCategoryName ? getCategoryName(schedule.events.category) : (typeof schedule.events.category === 'object' ? schedule.events.category.name : schedule.events.category)}
                    </span>
                  </div>
                )}
                {schedule.events?.gender && (
                  <div className="flex justify-between items-center">
                    <span className="text-[15px] text-gray-400">Division</span>
                    <span className="text-[15px] font-medium text-white capitalize">{schedule.events.gender} {schedule.events.division ? `(${schedule.events.division})` : ''}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Live Stream / Broadcast Link */}
            {schedule.stream_url && status === 'live' && (
              <div className="bg-blue-600/20 backdrop-blur-xl border border-blue-500/30 rounded-[24px] p-4 flex items-center gap-4 cursor-pointer hover:bg-blue-600/30 transition-colors">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-bold text-white mb-0.5">Watch Live</div>
                  <div className="text-[13px] text-blue-200">Streaming now on Facebook</div>
                </div>
                <ChevronRight size={18} className="text-blue-300" />
              </div>
            )}

            {/* Fan Predictions */}
            {departments.length === 2 && (
              <div className="bg-[#1c1c1e]/60 backdrop-blur-xl border border-white/5 rounded-[24px] p-5">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-[15px] font-bold text-white">Fan Predictions</div>
                  <div className="text-[11px] font-bold text-white/40 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">Who will win?</div>
                </div>
                
                <div className="flex w-full h-3 rounded-full overflow-hidden mb-3 bg-white/10">
                   {totalVotes === 0 ? (
                     <div className="w-full bg-white/10" />
                   ) : (
                     <>
                       <div className="bg-[#00e5ff] transition-all duration-500" style={{ width: `${d1Percentage}%` }} />
                       <div className="bg-[#ff3366] transition-all duration-500" style={{ width: `${d2Percentage}%` }} />
                     </>
                   )}
                </div>
                
                <div className="flex justify-between items-center mb-4">
                   <span className="text-[13px] font-bold text-[#00e5ff]">{d1Percentage.toFixed(0)}% <span className="text-white/60 font-medium ml-1">{departments[0]?.abbreviation}</span></span>
                   <span className="text-[13px] font-bold text-[#ff3366]"><span className="text-white/60 font-medium mr-1">{departments[1]?.abbreviation}</span> {d2Percentage.toFixed(0)}%</span>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleVote(departments[0]?.id as string)} disabled={hasVoted} className="flex-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/5 py-2.5 rounded-xl text-[13px] font-bold text-white transition-colors">
                    Vote {departments[0]?.abbreviation}
                  </button>
                  <button onClick={() => handleVote(departments[1]?.id as string)} disabled={hasVoted} className="flex-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/5 py-2.5 rounded-xl text-[13px] font-bold text-white transition-colors">
                    Vote {departments[1]?.abbreviation}
                  </button>
                </div>
              </div>
            )}

            {/* Head-to-Head History (Mocked Placeholder for aesthetics) */}
            {departments.length === 2 && (
              <div className="bg-[#1c1c1e]/60 backdrop-blur-xl border border-white/5 rounded-[24px] p-5">
                <div className="text-[15px] font-bold text-white mb-4">Head-to-Head History</div>
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex flex-col items-center">
                    <span className="text-[20px] font-black text-white">3</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{departments[0]?.abbreviation} WINS</span>
                  </div>
                  <div className="text-[12px] text-gray-500 font-bold">VS</div>
                  <div className="flex flex-col items-center">
                    <span className="text-[20px] font-black text-white">1</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{departments[1]?.abbreviation} WINS</span>
                  </div>
                </div>
              </div>
            )}

            {/* Standings Context */}
            <div className="bg-gradient-to-br from-purple-900/40 to-[#1c1c1e]/60 backdrop-blur-xl border border-purple-500/20 rounded-[24px] p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0">
                <Trophy size={18} className="text-purple-300" />
              </div>
              <div>
                <div className="text-[14px] font-bold text-white mb-1">Championship Implications</div>
                <div className="text-[13px] text-purple-200/70 leading-relaxed">
                  {schedule.context || "This match is critical for the overall standings. A win here secures a massive point advantage for the tournament leaderboard."}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

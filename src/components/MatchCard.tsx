"use client";

import Image from "next/image";
import { Schedule } from "@/features/schedule/models/scheduleTypes";
import { stringToColor } from "@/utils/colors";
import { MapPin, Clock, Users, Trophy, ChevronRight, Download } from "lucide-react";
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
  const [votedTeamId, setVotedTeamId] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const savedVote = localStorage.getItem(`vote_${schedule.id}`);
    if (savedVote) setVotedTeamId(savedVote);
  }, [schedule.id]);

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
    if (isVoting) return;
    setIsVoting(true);
    
    // Optimistic UI updates based on current voted state
    const prevVoted = votedTeamId;
    const prevPredictions = { ...predictions };
    
    if (prevVoted === deptId) {
      // Toggling off
      setVotedTeamId(null);
      setPredictions(prev => ({...prev, [deptId]: Math.max(0, (prev[deptId] || 1) - 1)}));
    } else {
      // Changing vote or new vote
      setVotedTeamId(deptId);
      setPredictions(prev => {
        const next = { ...prev };
        if (prevVoted) next[prevVoted] = Math.max(0, (next[prevVoted] || 1) - 1);
        next[deptId] = (next[deptId] || 0) + 1;
        return next;
      });
    }
    
    const { votePrediction } = await import('@/features/schedule/actions/votePrediction');
    const res = await votePrediction(schedule.id, deptId);
    
    if (!res.success) {
      // Revert on failure
      setVotedTeamId(prevVoted);
      setPredictions(prevPredictions);
      alert(res.error || "Failed to vote");
    } else if (res.counts) {
      // Sync exact counts from server
      setPredictions(res.counts);
      setVotedTeamId(res.userVote || null);
      if (res.userVote) {
        localStorage.setItem(`vote_${schedule.id}`, res.userVote);
      } else {
        localStorage.removeItem(`vote_${schedule.id}`);
      }
    }
    
    setIsVoting(false);
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

  // Removed dynamic background to favor clean white aesthetic
  const backgroundStyle = { backgroundColor: '#ffffff' };

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
  
  const totalMultiVotes = Object.values(predictions).reduce((a, b) => a + b, 0);

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
            <Image src={d.image_url} alt={d.name} fill sizes="84px" className="object-contain drop-shadow-md" />
          ) : (
            <div className="w-full h-full rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-white/10">
              {d.abbreviation || d.name.slice(0, 3)}
            </div>
          )}
        </div>
      <div className={`text-center font-bold text-[14px] sm:text-[16px] tracking-tight leading-tight w-full whitespace-nowrap overflow-hidden text-ellipsis ${isWinner ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-400'}`}>
        {d.name}
      </div>
      {score !== undefined && score !== null && !showTeamsInList && (
        <div className={`mt-0.5 text-[22px] font-black tracking-tight ${isWinner ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
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

      const dataUrl = await htmlToImage.toJpeg(cardRef.current, { quality: 0.95, backgroundColor: '#000' });
      
      if (shareBtn) shareBtn.style.display = 'flex';

      // Force download photo
      const link = document.createElement('a');
      link.download = `match-${schedule.id}.jpg`;
      link.href = dataUrl;
      link.click();
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
        className="w-full flex-1 bg-white dark:bg-[#1c1c1e]/90 rounded-[40px] overflow-hidden flex flex-col relative border border-gray-200 dark:border-white/10 shadow-xl" 
      >
        {/* Subtle top gradient for contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 dark:from-white/5 to-white/90 dark:to-transparent pointer-events-none" />
        
        {/* Fixed Download Button at bottom */}
        <button 
          id="share-btn"
          onClick={handleShare}
          disabled={isExporting}
          className="absolute bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-white dark:bg-[#2c2c2e] flex items-center justify-center border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-[#3c3c3e] transition-all disabled:opacity-50 shadow-lg"
        >
          {isExporting ? <Clock size={20} className="text-gray-900 dark:text-white animate-spin" /> : <Download size={20} className="text-gray-900 dark:text-white" />}
        </button>

        {/* Scrollable Content */}
        <div className="relative z-10 w-full h-full overflow-y-auto hide-scrollbar flex flex-col pb-24">
          
          {/* Top Sheet Handle (Visual only) */}
          <div className="w-10 h-1.5 bg-gray-300 dark:bg-white/20 rounded-full mx-auto mt-3" />

          {/* Top Bar: Event Name and Share */}
          <div className="flex justify-center items-center relative mt-3 mb-6">
            <span className="text-[13px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center px-12">
              {schedule.events?.name}
            </span>
            <div className="absolute top-0 right-5 flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full shadow-sm ${status === 'finished' ? 'bg-[#FF5F56]' : status === 'live' ? 'bg-[#27C93F]' : 'bg-[#FFBD2E]'}`} />
              {status !== 'finished' && (
                <span className={`text-[10px] font-bold ${status === 'live' ? 'text-[#27C93F]' : 'text-gray-400 dark:text-gray-500'}`}>
                  {status === 'live' ? 'LIVE' : (schedule.start_time.startsWith("00:00") ? "TBA" : formatTime(schedule.start_time))}
                </span>
              )}
            </div>
          </div>

          {/* Teams & Score/Time Hero Section */}
          <div className="px-2 sm:px-6 mb-8">
            {departments.length === 0 ? (
              <div className="text-center text-gray-400 dark:text-gray-500 py-10 font-bold">Teams TBA</div>
            ) : showTeamsInList ? (
              // If more than 2 teams, show the clustered teams in the center instead of a single icon
              <div className="flex flex-col items-center justify-center py-2">
                 <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-6">
                   {departments.map((d, i) => {
                     // Since there are many teams, we don't show individual scores here, we just show the team hero
                     return renderTeamHero(d, i, schedule.winner_id === d.id);
                   })}
                 </div>
              </div>
            ) : (
              <div className="flex justify-between items-center px-1 sm:px-2 gap-2">
                {renderTeamHero(departments[0], 0, schedule.winner_id === departments[0].id, schedule.score_a)}
                
                <div className="flex flex-col items-center justify-center shrink-0 min-w-[30px]" />

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
            <div className="bg-white/80 dark:bg-[#2c2c2e]/80 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-[24px] p-5 shadow-sm">
              <div className="text-center text-[15px] font-bold text-gray-900 dark:text-white mb-5">
                Match Details
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[15px] text-gray-500 dark:text-gray-400">Date</span>
                  <span className="text-[15px] font-medium text-gray-900 dark:text-gray-200">{formatDate(schedule.date)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[15px] text-gray-500 dark:text-gray-400">Time</span>
                  <span className="text-[15px] font-medium text-gray-900 dark:text-gray-200">
                    {schedule.start_time.startsWith("00:00") ? "TBA" : formatTime(schedule.start_time)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[15px] text-gray-500 dark:text-gray-400">Venue</span>
                  <span className="text-[15px] font-medium text-gray-900 dark:text-gray-200 text-right max-w-[150px] truncate">{schedule.venues?.name || 'TBA'}</span>
                </div>
                
                {schedule.events?.category && (
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-[15px] text-gray-500 dark:text-gray-400 shrink-0">Category</span>
                    <span className="text-[15px] font-medium text-gray-900 dark:text-gray-200 max-w-[180px] text-right truncate">
                      {getCategoryName ? getCategoryName(schedule.events.category) : (typeof schedule.events.category === 'object' ? schedule.events.category.name : schedule.events.category)}
                    </span>
                  </div>
                )}
                {schedule.events?.gender && (
                  <div className="flex justify-between items-center">
                    <span className="text-[15px] text-gray-500 dark:text-gray-400">Division</span>
                    <span className="text-[15px] font-medium text-gray-900 dark:text-gray-200 capitalize">{schedule.events.gender} {schedule.events.division ? `(${schedule.events.division})` : ''}</span>
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
              <div className="bg-white/80 dark:bg-[#2c2c2e]/80 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-[24px] p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-[15px] font-bold text-gray-900 dark:text-white">Fan Predictions</div>
                  <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-100 dark:bg-black/30 px-2 py-1 rounded-md">Who will win?</div>
                </div>
                
                <div className="flex w-full h-3 rounded-full overflow-hidden mb-3 bg-gray-100 dark:bg-white/10">
                   {totalVotes === 0 ? (
                     <div className="w-full bg-gray-100 dark:bg-white/10" />
                   ) : (
                     <>
                       <div className="bg-[#00e5ff] transition-all duration-500" style={{ width: `${d1Percentage}%` }} />
                       <div className="bg-[#ff3366] transition-all duration-500" style={{ width: `${d2Percentage}%` }} />
                     </>
                   )}
                </div>
                
                <div className="flex justify-between items-center mb-4">
                   <span className="text-[13px] font-bold text-[#00b8cc]">{d1Percentage.toFixed(0)}% <span className="text-gray-500 dark:text-gray-400 font-medium ml-1">{departments[0]?.abbreviation}</span></span>
                   <span className="text-[13px] font-bold text-[#e62e5c]"><span className="text-gray-500 dark:text-gray-400 font-medium mr-1">{departments[1]?.abbreviation}</span> {d2Percentage.toFixed(0)}%</span>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleVote(departments[0]?.id as string)} disabled={isVoting} className={`flex-1 border py-2.5 rounded-xl text-[13px] font-bold transition-colors ${votedTeamId === departments[0]?.id ? 'bg-[#00e5ff]/10 text-[#00b8cc] border-[#00b8cc]/30' : 'bg-white dark:bg-[#1c1c1e] hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 disabled:opacity-50 shadow-sm'}`}>
                    {votedTeamId === departments[0]?.id ? 'Voted' : `Vote ${departments[0]?.abbreviation}`}
                  </button>
                  <button onClick={() => handleVote(departments[1]?.id as string)} disabled={isVoting} className={`flex-1 border py-2.5 rounded-xl text-[13px] font-bold transition-colors ${votedTeamId === departments[1]?.id ? 'bg-[#ff3366]/10 text-[#e62e5c] border-[#e62e5c]/30' : 'bg-white dark:bg-[#1c1c1e] hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 disabled:opacity-50 shadow-sm'}`}>
                    {votedTeamId === departments[1]?.id ? 'Voted' : `Vote ${departments[1]?.abbreviation}`}
                  </button>
                </div>
              </div>
            )}

            {/* Fan Predictions for Multi-Team */}
            {departments.length >= 3 && (
              <div className="bg-white/80 dark:bg-[#2c2c2e]/80 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-[24px] p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-[15px] font-bold text-gray-900 dark:text-white">Fan Predictions</div>
                  <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-100 dark:bg-black/30 px-2 py-1 rounded-md">Who will win?</div>
                </div>
                
                <div className="flex flex-col gap-3">
                  {departments.slice(0, 5).map(d => {
                    const dVotes = predictions[d.id] || 0;
                    const dPercentage = totalMultiVotes > 0 ? (dVotes / totalMultiVotes) * 100 : 0;
                    
                    return (
                      <button 
                        key={d.id} 
                        onClick={() => handleVote(d.id)} 
                        disabled={isVoting} 
                        className={`relative w-full overflow-hidden border py-2.5 px-3 rounded-xl flex items-center justify-between transition-colors group shadow-sm ${votedTeamId === d.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-500/30' : 'bg-white dark:bg-[#1c1c1e] hover:bg-gray-50 dark:hover:bg-white/10 border-gray-200 dark:border-white/10 disabled:opacity-90'}`}
                      >
                         <div className={`absolute left-0 top-0 bottom-0 transition-all duration-500 z-0 ${votedTeamId === d.id ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-white/5'}`} style={{ width: `${votedTeamId || totalMultiVotes > 0 ? dPercentage : 0}%` }} />
                         
                         <div className="flex items-center gap-3 z-10">
                           <div className="w-5 h-5 relative">
                             {d.image_url ? <Image src={d.image_url} alt="" fill sizes="20px" className="object-contain" /> : <div className="w-full h-full bg-gray-200 dark:bg-white/20 rounded-full" />}
                           </div>
                           <span className={`text-[13px] font-bold ${votedTeamId === d.id ? 'text-blue-900 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>{d.name}</span>
                         </div>
                         <div className={`z-10 text-[13px] font-bold ${votedTeamId === d.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                           {votedTeamId === d.id ? 'Voted' : (votedTeamId || totalMultiVotes > 0 ? `${dPercentage.toFixed(0)}%` : 'Vote')}
                         </div>
                      </button>
                    );
                  })}
                  {departments.length > 5 && (
                     <div className="text-center text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase mt-2">
                       Voting limited to Top 5
                     </div>
                  )}
                </div>
              </div>
            )}

            {/* Head-to-Head History (Mocked Placeholder for aesthetics) */}
            {departments.length === 2 && (
              <div className="bg-white/80 dark:bg-[#2c2c2e]/80 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-[24px] p-5 shadow-sm">
                <div className="text-[15px] font-bold text-gray-900 dark:text-white mb-4">Head-to-Head History</div>
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-black/30 rounded-xl border border-gray-200 dark:border-white/5">
                  <div className="flex flex-col items-center">
                    <span className="text-[20px] font-black text-gray-900 dark:text-white">3</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">{departments[0]?.abbreviation} WINS</span>
                  </div>
                  <div className="text-[12px] text-gray-400 dark:text-gray-500 font-bold">VS</div>
                  <div className="flex flex-col items-center">
                    <span className="text-[20px] font-black text-gray-900 dark:text-white">1</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">{departments[1]?.abbreviation} WINS</span>
                  </div>
                </div>
              </div>
            )}

            {/* Standings Context */}
            <div className="bg-gradient-to-br from-purple-50/80 dark:from-purple-900/20 to-white/90 dark:to-[#1c1c1e] backdrop-blur-xl border border-purple-100 dark:border-purple-500/20 rounded-[24px] p-5 flex items-start gap-4 shadow-sm">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center shrink-0">
                <Trophy size={18} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-[14px] font-bold text-purple-900 dark:text-purple-300 mb-1">Championship Implications</div>
                <div className="text-[13px] text-purple-800/80 dark:text-purple-200/70 leading-relaxed">
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

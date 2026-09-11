"use client";

import Image from "next/image";
import { Schedule } from "@/features/schedule/models/scheduleTypes";
import { teamNameToColor } from "@/utils/colors";
import { Clock, ChevronRight, Download as DownloadIcon, Share, X, MessageCircle, MoreHorizontal, Link as LinkIcon } from "lucide-react";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { formatTime } from "@/lib/utils";
import { Department } from "@/shared/models/tournamentTypes";
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Record<string, number>>({});
  const [votedTeamId, setVotedTeamId] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (isVoting || votedTeamId) return;
    setIsVoting(true);
    
    // Optimistic UI updates based on current voted state
    const prevVoted = votedTeamId;
    const prevPredictions = { ...predictions };
    
    setVotedTeamId(deptId);
    setPredictions(prev => ({ ...prev, [deptId]: (prev[deptId] || 0) + 1 }));
    
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

  const { status } = getDynamicStatus(schedule);
  
  // Fetch department info and sort by medal if the event is finished
  const departments = schedule.departments.map(getDepartmentInfo);
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

  const hasPodium = status === 'finished' && Boolean((schedule.events as any)?.results) && departments.length >= 3;
  const displayDepartments = hasPodium
    ? [departments[1], departments[0], departments[2], ...departments.slice(3)]
    : departments;
  
  // Show teams in list format (bottom) if > 2 teams
  const showTeamsInList = departments.length > 2;

  const teamColors = displayDepartments
    .slice(0, 3)
    .map((department) => teamNameToColor(department.name || department.abbreviation || department.id));

  const backgroundStyle = (() => {
    if (teamColors.length === 0) {
      return {
        background: "linear-gradient(180deg, rgba(38, 154, 122, 0.72) 0%, rgba(38, 154, 122, 0.28) 100%)",
      };
    }

    if (teamColors.length === 1) {
      return {
        background: [
          `radial-gradient(circle at 50% -8%, ${teamColors[0]} 0%, ${teamColors[0]}d0 34%, transparent 76%)`,
          `linear-gradient(180deg, ${teamColors[0]}8f 0%, ${teamColors[0]}42 100%)`,
        ].join(", "),
      };
    }

    if (teamColors.length === 2) {
      return {
        background: [
          `radial-gradient(circle at 8% 0%, ${teamColors[0]} 0%, ${teamColors[0]}c4 30%, transparent 68%)`,
          `radial-gradient(circle at 92% 0%, ${teamColors[1]} 0%, ${teamColors[1]}c4 30%, transparent 68%)`,
          `linear-gradient(135deg, ${teamColors[0]}66 0%, rgba(20, 20, 22, 0.24) 50%, ${teamColors[1]}66 100%)`,
        ].join(", "),
      };
    }

    return {
      background: [
        `radial-gradient(circle at 0% 0%, ${teamColors[0]} 0%, ${teamColors[0]}b8 25%, transparent 62%)`,
        `radial-gradient(circle at 50% -10%, ${teamColors[1]} 0%, ${teamColors[1]}c8 27%, transparent 64%)`,
        `radial-gradient(circle at 100% 0%, ${teamColors[2]} 0%, ${teamColors[2]}b8 25%, transparent 62%)`,
        `linear-gradient(135deg, ${teamColors[0]}52 0%, ${teamColors[1]}4a 50%, ${teamColors[2]}52 100%)`,
      ].join(", "),
    };
  })();

  const getMedal = (deptId: string) => {
    if (status !== 'finished' || !(schedule.events as any)?.results) return null;
    return (schedule.events as any).results.find((r: any) => r.department_id === deptId)?.medal_type;
  };

  // Calculate prediction percentages
  const d1Votes = predictions[departments[0]?.id] || 0;
  const d2Votes = predictions[departments[1]?.id] || 0;
  const totalVotes = d1Votes + d2Votes;
  const d1Percentage = totalVotes > 0 ? (d1Votes / totalVotes) * 100 : 0;
  const d2Percentage = totalVotes > 0 ? (d2Votes / totalVotes) * 100 : 0;
  
  const totalMultiVotes = Object.values(predictions).reduce((a, b) => a + b, 0);

  const renderTeamHero = (d: Department, index: number, isWinner: boolean = false, score?: number | null) => {
    const medal = getMedal(d.id);
    const badge = medal === 'gold' ? '🥇' : medal === 'silver' ? '🥈' : medal === 'bronze' ? '🥉' : null;
    
    return (
      <div key={d.id || index} className="relative mx-auto flex w-full min-w-0 max-w-[110px] flex-1 shrink flex-col items-center">
        <div className="relative w-16 h-16 sm:w-[84px] sm:h-[84px] mb-2 sm:mb-3 shrink-0">
          {badge && (
            <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 text-3xl sm:text-4xl z-20 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
              {badge}
            </div>
          )}
          {d.image_url ? (
            <Image src={d.image_url} alt={d.name} fill sizes="84px" className="object-contain drop-shadow-md" priority />
          ) : (
            <div className="w-full h-full rounded-full bg-black/20 flex items-center justify-center text-xl sm:text-2xl font-bold text-white shadow-sm border border-white/20 backdrop-blur-md">
              {d.abbreviation || d.name.slice(0, 3)}
            </div>
          )}
        </div>
      <div className={`text-center font-bold text-[14px] sm:text-[16px] tracking-tight leading-tight w-full whitespace-nowrap overflow-hidden text-ellipsis drop-shadow-sm ${isWinner ? 'text-white' : 'text-white/75'}`}>
        {d.name}
      </div>
      {score !== undefined && score !== null && !showTeamsInList && (
        <div className={`mt-0.5 text-[22px] font-black tracking-tight drop-shadow-sm ${isWinner ? 'text-white' : 'text-white/65'}`}>
          {score}
        </div>
      )}
    </div>
  );
};

  const generateImage = async (): Promise<string | null> => {
    if (!exportRef.current) return null;
    try {
      return await htmlToImage.toJpeg(exportRef.current, { 
        quality: 0.95, 
        backgroundColor: '#000', 
        pixelRatio: 2,
        style: { opacity: '1' } 
      });
    } catch (err) {
      console.error('Error generating image', err);
      alert('Failed to generate image. Please try again.');
      return null;
    }
  };

  const openShareMenu = async () => {
    setIsShareOpen(true);
    setPreviewImage(null);
    const dataUrl = await generateImage();
    setPreviewImage(dataUrl);
  };

  const handleDownload = async () => {
    if (!previewImage) return;
    const link = document.createElement('a');
    link.download = `match-${schedule.id}.jpg`;
    link.href = previewImage;
    link.click();
    setIsShareOpen(false);
  };

  const handleNativeShare = async () => {
    if (!previewImage) return;
    if (navigator.share) {
      try {
        // Synchronous conversion to preserve user gesture in Safari
        const byteString = atob(previewImage.split(',')[1]);
        const mimeString = previewImage.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const dw = new DataView(ab);
        for (let i = 0; i < byteString.length; i++) {
          dw.setUint8(i, byteString.charCodeAt(i));
        }
        const blob = new Blob([ab], { type: mimeString });
        const file = new File([blob], `match-${schedule.id}.jpg`, { type: 'image/jpeg' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: schedule.events?.name,
            text: 'Check out this match result!',
          });
        } else {
          await navigator.share({
            title: schedule.events?.name,
            text: 'Check out this match result!',
            url: window.location.href,
          });
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      alert("Native sharing is not supported on this browser or requires an HTTPS connection (currently testing on HTTP). Please use 'Save Image' for now.");
    }
    setIsShareOpen(false);
  };

  return (
    <div className="w-full h-full flex flex-col pt-2 pb-4 relative z-0">
      {/* Hidden Export View for Compact Share Image (Positioned in viewport to prevent Safari culling) */}
      <div className="absolute top-0 left-0 -z-10 pointer-events-none" style={{ opacity: 0.01 }}>
        <div 
          ref={exportRef} 
          className="w-[400px] bg-[#161618] rounded-[40px] overflow-hidden flex flex-col relative border border-white/10 shadow-xl pb-8 pt-4"
        >
          <div className="absolute inset-0 pointer-events-none" style={backgroundStyle} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/20 to-black/45 pointer-events-none" />
          <div className="relative z-10 w-full flex flex-col pt-6 pb-6">
            <div className="flex justify-center items-center relative mb-10 mt-2">
              <span className="text-[16px] font-black text-white uppercase tracking-widest text-center px-8 drop-shadow-sm">
                {schedule.events?.name}
              </span>
            </div>
            
            <div className="px-6 mb-6">
              {departments.length === 0 ? (
                <div className="text-center text-gray-500 py-10 font-bold">Teams TBA</div>
              ) : showTeamsInList ? (
                <div className="flex flex-col items-center justify-center py-2">
                  {hasPodium ? (
                    <div className="grid w-full grid-cols-3 items-end gap-3 mb-2">
                      {displayDepartments.slice(0, 3).map((d, i) => (
                        <div key={d.id} className={i === 1 ? "pb-6" : ""}>
                          {renderTeamHero(d, i, schedule.winner_id === d.id)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-center gap-4 mb-2">
                      {displayDepartments.slice(0, 4).map((d, i) => renderTeamHero(d, i, schedule.winner_id === d.id))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-between items-center gap-2">
                  {renderTeamHero(departments[0], 0, schedule.winner_id === departments[0].id, schedule.score_a)}
                  <div className="flex flex-col items-center justify-center shrink-0 min-w-[40px]">
                    <span className="text-white/40 font-black text-2xl italic">VS</span>
                  </div>
                  {renderTeamHero(departments[1], 1, schedule.winner_id === departments[1].id, schedule.score_b)}
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-center items-center opacity-30">
              <span className="text-[14px] font-black tracking-widest uppercase text-white">Monument</span>
            </div>
          </div>
        </div>
      </div>

      <div 
        ref={cardRef}
        className="w-full flex-1 bg-[#e7e7ea] dark:bg-[#161618] rounded-[40px] overflow-hidden flex flex-col relative border border-gray-200 dark:border-white/10 shadow-xl"
      >
        <div className="absolute inset-0 pointer-events-none" style={backgroundStyle} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/20 to-black/45 pointer-events-none" />

        {/* Custom Share Sheet Modal (Suno Style) */}
        {mounted && typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {isShareOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-xl flex flex-col pt-safe px-6 pb-8"
              >
                {/* Header */}
                <div className="flex items-center justify-center relative py-6 shrink-0 mt-4">
                  <h3 className="text-[16px] font-bold text-white tracking-wide">
                    Share Match
                  </h3>
                  <button onClick={() => setIsShareOpen(false)} className="absolute right-0 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors">
                    <X size={16} />
                  </button>
                </div>

                {/* Preview Image */}
                <div className="flex-1 flex flex-col items-center justify-center min-h-0 py-4">
                  {previewImage ? (
                    <div className="relative w-full max-w-[320px] aspect-[4/4.5] flex items-center justify-center">
                      <motion.div 
                        initial={{ scale: 0.9, y: 10 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="w-full relative shadow-2xl rounded-[32px] overflow-hidden border border-white/10"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewImage} alt="Match Preview" className="w-full h-auto object-contain block" />
                      </motion.div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-white/50">
                      <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                      <span className="text-[13px] font-medium animate-pulse">Generating preview...</span>
                    </div>
                  )}
                </div>

                {/* Share Action Buttons */}
                <div className="mt-auto grid grid-cols-4 gap-y-8 gap-x-2 w-full max-w-sm mx-auto pt-6 shrink-0 pb-4">
                  {/* Save Image */}
                  <button onClick={handleDownload} disabled={!previewImage} className="flex flex-col items-center gap-2 group disabled:opacity-50">
                    <div className="w-[52px] h-[52px] rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white group-hover:bg-white/20 transition-all">
                      <DownloadIcon size={20} />
                    </div>
                    <span className="text-[11px] font-medium text-white/80">Save</span>
                  </button>

                  {/* Instagram */}
                  <button onClick={handleNativeShare} disabled={!previewImage} className="flex flex-col items-center gap-2 group disabled:opacity-50">
                    <div className="w-[52px] h-[52px] rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white group-hover:bg-white/20 transition-all">
                      <FaInstagram size={22} />
                    </div>
                    <span className="text-[11px] font-medium text-white/80">Instagram</span>
                  </button>

                  {/* Facebook */}
                  <button onClick={handleNativeShare} disabled={!previewImage} className="flex flex-col items-center gap-2 group disabled:opacity-50">
                    <div className="w-[52px] h-[52px] rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white group-hover:bg-white/20 transition-all">
                      <FaFacebookF size={20} />
                    </div>
                    <span className="text-[11px] font-medium text-white/80">Facebook</span>
                  </button>

                  {/* More */}
                  <button onClick={handleNativeShare} disabled={!previewImage} className="flex flex-col items-center gap-2 group disabled:opacity-50">
                    <div className="w-[52px] h-[52px] rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white group-hover:bg-white/20 transition-all">
                      <MoreHorizontal size={20} />
                    </div>
                    <span className="text-[11px] font-medium text-white/80">More</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        , document.body)}

        {/* Scrollable Content */}
        <div className="relative z-10 w-full h-full overflow-y-auto hide-scrollbar flex flex-col pb-24">
          
          {/* Top Sheet Handle (Visual only) */}
          <div className="w-10 h-1.5 bg-white/35 rounded-full mx-auto mt-3" />

          {/* Top Bar: Event Name and Share */}
          <div className="flex justify-center items-center relative mt-3 mb-6">
            <span className="text-[13px] font-bold text-white/75 uppercase tracking-widest text-center px-12 drop-shadow-sm">
              {schedule.events?.name}
            </span>
            <div className="absolute top-0 right-5 flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full shadow-sm ${status === 'finished' ? 'bg-[#FF5F56]' : status === 'live' ? 'bg-[#27C93F]' : 'bg-[#FFBD2E]'}`} />
              {status !== 'finished' && (
                <span className={`text-[10px] font-bold ${status === 'live' ? 'text-[#47ef61]' : 'text-white/70'}`}>
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
              <div className="flex flex-col items-center justify-center py-2">
                {hasPodium ? (
                  <>
                    <div className="grid w-full grid-cols-3 items-end gap-1 sm:gap-3 mb-6">
                      {displayDepartments.slice(0, 3).map((d, i) => (
                        <div key={d.id} className={i === 1 ? "pb-5" : ""}>
                          {renderTeamHero(d, i, schedule.winner_id === d.id)}
                        </div>
                      ))}
                    </div>
                    {displayDepartments.length > 3 && (
                      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-6">
                        {displayDepartments.slice(3).map((d, i) => renderTeamHero(d, i + 3, false))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-6">
                    {displayDepartments.map((d, i) => renderTeamHero(d, i, schedule.winner_id === d.id))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-between items-center px-1 sm:px-2 gap-2">
                {renderTeamHero(departments[0], 0, schedule.winner_id === departments[0].id, schedule.score_a)}
                
                <div className="flex flex-col items-center justify-center shrink-0 min-w-[30px]" />

                {renderTeamHero(departments[1], 1, schedule.winner_id === departments[1].id, schedule.score_b)}
              </div>
            )}
          </div>



          {/* Info Cards Area */}
          <div className="px-4 flex-1 space-y-4 pb-8">
            
            {/* Match Details Card */}
            <div className="bg-white/55 dark:bg-black/20 backdrop-blur-2xl border border-white/60 dark:border-white/15 rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
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
            {status !== 'finished' && departments.length === 2 && (
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
                  <button onClick={() => handleVote(departments[0]?.id as string)} disabled={isVoting || Boolean(votedTeamId)} className={`flex-1 border py-2.5 rounded-xl text-[13px] font-bold transition-colors ${votedTeamId === departments[0]?.id ? 'bg-[#00e5ff]/10 text-[#00b8cc] border-[#00b8cc]/30' : 'bg-white dark:bg-[#1c1c1e] hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 disabled:opacity-50 shadow-sm'}`}>
                    {votedTeamId === departments[0]?.id ? 'Voted' : votedTeamId ? 'Locked' : `Vote ${departments[0]?.abbreviation}`}
                  </button>
                  <button onClick={() => handleVote(departments[1]?.id as string)} disabled={isVoting || Boolean(votedTeamId)} className={`flex-1 border py-2.5 rounded-xl text-[13px] font-bold transition-colors ${votedTeamId === departments[1]?.id ? 'bg-[#ff3366]/10 text-[#e62e5c] border-[#e62e5c]/30' : 'bg-white dark:bg-[#1c1c1e] hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 disabled:opacity-50 shadow-sm'}`}>
                    {votedTeamId === departments[1]?.id ? 'Voted' : votedTeamId ? 'Locked' : `Vote ${departments[1]?.abbreviation}`}
                  </button>
                </div>
              </div>
            )}

            {/* Fan Predictions for Multi-Team */}
            {status !== 'finished' && departments.length >= 3 && (
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
                        disabled={isVoting || Boolean(votedTeamId)}
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
                           {votedTeamId === d.id ? 'Voted' : votedTeamId ? 'Locked' : (totalMultiVotes > 0 ? `${dPercentage.toFixed(0)}%` : 'Vote')}
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

            {/* Big Share Button (Duolingo Style) */}
            <button
              id="share-btn"
              onClick={openShareMenu}
              className="w-full mt-4 bg-white text-black font-black text-[15px] tracking-wider uppercase py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_16px_rgba(0,0,0,0.15)] hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Share size={20} className="text-black" strokeWidth={2.5} />
              Share Match
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

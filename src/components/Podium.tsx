"use client";
import Image from 'next/image';
import Link from 'next/link';
import { motion } from "framer-motion";

interface LeaderboardRow {
  id: string;
  name: string;
  abbreviation: string | null;
  image_url?: string;
  total_points: number;
  golds: number;
  silvers: number;
  bronzes: number;
}

interface PodiumProps {
  leaderboard: LeaderboardRow[];
  mysteryMode?: boolean;
}

// Maps podium order: [2nd, 1st, 3rd]
const PODIUM_ORDER = [1, 0, 2];
const PODIUM_HEIGHT = ['h-20', 'h-32', 'h-14'];         // platform heights
const PODIUM_LOGO   = ['w-16 h-16', 'w-24 h-24', 'w-14 h-14'];  // logo sizes
const PODIUM_MEDAL  = ['🥈', '🥇', '🥉'];
const PODIUM_LABEL  = ['2', '1', '3'];
const PODIUM_COLOR  = [
  'bg-gradient-to-b from-gray-400 to-gray-600',   // silver
  'bg-gradient-to-b from-yellow-400 to-yellow-600', // gold
  'bg-gradient-to-b from-orange-400 to-orange-600', // bronze
];

export default function ApplePodium({ leaderboard, mysteryMode }: PodiumProps) {
  const top3 = PODIUM_ORDER.map(i => leaderboard[i] ?? null);
  const rest  = leaderboard.slice(3);

  return (
    <div className="w-full">
      {/* ── Podium ── */}
      <div className="flex items-end justify-center gap-3 px-4 pt-6 pb-0">
        {top3.map((team, col) => {
          const rank = PODIUM_ORDER[col]; // 0-based rank index
          return (
            <motion.div
              key={team?.id ?? col}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: col === 1 ? 0 : 0.15 }}
              className="flex flex-col items-center flex-1"
            >
              {/* Medal emoji */}
              <div className="text-2xl mb-1">{PODIUM_MEDAL[col]}</div>

              {/* Logo */}
              <div className={`relative ${PODIUM_LOGO[col]} mb-2`}>
                {team?.image_url ? (
                  <Image
                    src={team.image_url}
                    alt={team.name}
                    fill
                    sizes="96px"
                    className="object-contain drop-shadow-sm"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-white/20 rounded-full text-[10px] font-black text-gray-500 dark:text-gray-300">
                    {team?.abbreviation?.slice(0, 3) ?? '?'}
                  </div>
                )}
              </div>

              {/* Name */}
              {team ? (
                <Link href={`/teams/${team.id}`} className="block text-center mb-2 group">
                  <div className="text-[11px] font-black text-gray-900 dark:text-white truncate max-w-[80px] group-hover:text-[#0A84FF] dark:group-hover:text-[#409cff] transition-colors">
                    {team.abbreviation ?? team.name}
                  </div>
                  <div className={`text-[13px] font-black tabular-nums ${col === 1 ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                    {mysteryMode ? '???' : team.total_points}
                    <span className="text-[9px] font-medium text-gray-400 dark:text-gray-500 ml-0.5">pts</span>
                  </div>
                </Link>
              ) : (
                <div className="text-center mb-2">
                  <div className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold">TBD</div>
                  <div className="text-[13px] text-gray-300 dark:text-gray-600 font-black">—</div>
                </div>
              )}

              {/* Platform block */}
              <div className={`w-full rounded-t-xl ${PODIUM_HEIGHT[col]} ${PODIUM_COLOR[col]} flex items-center justify-center shadow-lg`}>
                <span className="text-white font-black text-2xl select-none">{PODIUM_LABEL[col]}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Remaining table ── */}
      {rest.length > 0 && (
        <div className="px-4 mt-4">
          {/* Column headers */}
          <div className="flex items-center text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest px-3 mb-1">
            <div className="w-6 text-center">#</div>
            <div className="flex-1 ml-3">Team</div>
            <div className="flex gap-3 shrink-0">
              <div className="w-5 text-center">G</div>
              <div className="w-5 text-center">S</div>
              <div className="w-5 text-center">B</div>
              <div className="w-10 text-right">PTS</div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm">
            {rest.map((dept, i) => (
              <motion.div
                key={dept.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <Link
                  href={`/teams/${dept.id}`}
                  className={`flex items-center px-3 py-2.5 ${i !== rest.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''} hover:bg-gray-50 dark:hover:bg-white/10 transition-colors`}
                >
                  <div className="w-6 text-center font-black text-gray-400 dark:text-gray-500 text-[13px]">{i + 4}</div>

                  <div className="w-7 h-7 mx-2.5 relative shrink-0">
                    {dept.image_url ? (
                      <Image src={dept.image_url} alt={dept.name} fill sizes="28px" className="object-contain" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-white/20 rounded-full flex items-center justify-center text-[9px] font-bold text-gray-500 dark:text-gray-300">
                        {dept.abbreviation?.slice(0, 2) ?? '??'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-bold text-gray-900 dark:text-white truncate text-[14px] tracking-tight">{dept.name}</div>
                    {dept.abbreviation && (
                      <div className="text-[9px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">{dept.abbreviation}</div>
                    )}
                  </div>

                  <div className="flex gap-3 text-[13px] tabular-nums shrink-0">
                    <div className="w-5 text-center font-medium text-yellow-500">{dept.golds}</div>
                    <div className="w-5 text-center font-medium text-gray-500 dark:text-gray-400">{dept.silvers}</div>
                    <div className="w-5 text-center font-medium text-orange-500">{dept.bronzes}</div>
                    <div className="w-10 text-right font-black text-gray-700 dark:text-gray-300">
                      {mysteryMode ? '???' : dept.total_points}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
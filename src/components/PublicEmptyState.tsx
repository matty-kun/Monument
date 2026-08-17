import React from 'react';
import Link from 'next/link';
import { History } from 'lucide-react';

export default function PublicEmptyState() {
  return (
    <div className="min-h-[70vh] bg-black flex flex-col items-center justify-center text-center px-6 animate-fadeIn">
      <div className="w-20 h-20 mb-8 opacity-70">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/monument-logo.png" alt="Monument" className="w-full h-full object-contain drop-shadow-2xl" />
      </div>
      <h1 className="text-[32px] md:text-4xl font-black text-white tracking-tight mb-4">
        The Season Has Concluded
      </h1>
      <p className="text-[15px] text-gray-400 font-medium max-w-sm leading-relaxed mb-10">
        There are currently no active intramurals or live tournaments happening. Check back later for upcoming seasons.
      </p>
      
      <Link href="/history" className="group flex items-center gap-3 bg-[#1c1c1e] hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all px-8 py-4 rounded-full text-white shadow-lg active:scale-95">
        <History className="text-[#0A84FF] group-hover:-rotate-12 transition-transform duration-300" size={20} strokeWidth={2.5} />
        <span className="text-[15px] font-bold tracking-wide">View Past Seasons</span>
      </Link>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

interface LeaderboardRow {
  id: string;
  name: string;
  total_points: number;
  golds: number;
  silvers: number;
  bronzes: number;
}

interface EventRow {
  id: string;
  name: string;
  schedule: string; // ISO datetime
}

interface Announcement {
  id: string;
  message: string;
  image_url?: string;
}

export default function BigScreenPage() {
  const [viewIndex, setViewIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    fetchLeaderboard();
    fetchEvents();
    fetchAnnouncements();

    // Auto-rotate
    const interval = setInterval(() => {
      if (!paused) {
        setViewIndex((prev) => (prev + 1) % 4); // now 4 views
      }
    }, 10000);

    // Supabase realtime subscriptions
    const resultsChannel = supabase
      .channel("results-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, () =>
        fetchLeaderboard()
      )
      .subscribe();

    const annChannel = supabase
      .channel("announcements-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () =>
        fetchAnnouncements()
      )
      .subscribe();

    // Keyboard controls
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setViewIndex((prev) => (prev + 1) % 4);
        setPaused(true);
      } else if (e.key === "ArrowLeft") {
        setViewIndex((prev) => (prev - 1 + 4) % 4);
        setPaused(true);
      } else if (e.key === " ") {
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(resultsChannel);
      supabase.removeChannel(annChannel);
      window.removeEventListener("keydown", handleKey);
    };
  }, [paused]);

  async function fetchLeaderboard() {
    const { data } = await supabase.rpc("get_leaderboard");
    if (data) setLeaderboard(data);
  }

  async function fetchEvents() {
    const { data } = await supabase.from("events").select("*").order("schedule", { ascending: true });
    if (data) setEvents(data);
  }

  async function fetchAnnouncements() {
        const now = new Date().toISOString();
        const { data } = await supabase
            .from("announcements")
            .select("*")
            .eq("active", true)
            .lte("start_time", now)
            .or(`end_time.is.null,end_time.gte.${now}`)
            .order("created_at", { ascending: false });

        if (data) setAnnouncements(data);
    }

  const views = [
    <LeaderboardView key="leaderboard" leaderboard={leaderboard} />,
    <MedalsView key="medals" leaderboard={leaderboard} />,
    <EventsView key="events" events={events} />,
    <AnnouncementsView key="announcements" announcements={announcements} />,
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={viewIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="w-full max-w-5xl"
        >
          {views[viewIndex]}
        </motion.div>
      </AnimatePresence>

      {/* Small status bar at the bottom */}
      <div className="absolute bottom-4 text-gray-400 text-sm">
        {paused ? "⏸ Paused (use ← → to change, SPACE to resume)" : "▶ Auto-rotating (SPACE to pause)"}
      </div>
    </div>
  );
}

function LeaderboardView({ leaderboard }: { leaderboard: LeaderboardRow[] }) {
  return (
    <>
      <h1 className="text-4xl md:text-6xl font-bold mb-8 text-yellow-400">🏆 Leaderboard</h1>
      {leaderboard.map((dept, index) => (
        <div
          key={dept.id}
          className={`flex justify-between items-center p-6 mb-4 rounded-2xl shadow-lg 
          ${index === 0 ? "bg-yellow-500 text-black" : "bg-gray-800"}`}
        >
          <span className="text-2xl md:text-4xl font-bold">
            #{index + 1} {dept.name}
          </span>
          <span className="text-3xl md:text-5xl font-extrabold">{dept.total_points}</span>
        </div>
      ))}
    </>
  );
}

function MedalsView({ leaderboard }: { leaderboard: LeaderboardRow[] }) {
  return (
    <>
      <h1 className="text-4xl md:text-6xl font-bold mb-8 text-yellow-400">🥇 Medal Tally</h1>
      {leaderboard.map((dept) => (
        <div key={dept.id} className="flex justify-between items-center p-6 mb-4 rounded-2xl bg-gray-800">
          <span className="text-2xl md:text-4xl font-bold">{dept.name}</span>
          <div className="flex gap-6 text-2xl md:text-3xl">
            <span className="text-yellow-400">🥇 {dept.golds}</span>
            <span className="text-gray-300">🥈 {dept.silvers}</span>
            <span className="text-orange-400">🥉 {dept.bronzes}</span>
          </div>
        </div>
      ))}
    </>
  );
}

function EventsView({ events }: { events: EventRow[] }) {
  return (
    <>
      <h1 className="text-4xl md:text-6xl font-bold mb-8 text-yellow-400">📅 Upcoming Events</h1>
      {events.map((e) => (
        <div key={e.id} className="flex justify-between items-center p-6 mb-4 rounded-2xl bg-gray-800">
          <span className="text-2xl md:text-3xl font-bold">{e.name}</span>
          <span className="text-xl">{new Date(e.schedule).toLocaleString()}</span>
        </div>
      ))}
    </>
  );
}

export function AnnouncementsView({ announcements }: { announcements: Announcement[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (announcements.length > 1) {
      const interval = setInterval(() => {
        setIndex((prev) => (prev + 1) % announcements.length);
      }, 5000); // 5 seconds per announcement
      return () => clearInterval(interval);
    }
  }, [announcements]);

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <h1 className="text-5xl md:text-7xl font-bold text-yellow-400">📢 No Announcements</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center">
      <h1 className="text-4xl md:text-6xl font-bold mb-8 text-yellow-400">📢 Announcement</h1>

      <AnimatePresence mode="wait">
        <motion.div
          key={announcements[index].id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="mb-8"
        >
          {announcements[index].image_url && (
            <img
              src={announcements[index].image_url}
              alt="Announcement"
              className="max-h-64 mx-auto mb-4 rounded-xl"
            />
          )}
          <p className="text-2xl md:text-4xl font-semibold">{announcements[index].message}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useState } from "react";
// import { AnnouncementsAdmin } from "../../components/admin/AnnouncementsAdmin";
import { DepartmentsAdmin } from "../../components/admin/DepartmentsAdmin";
import { EventsAdmin } from "../../components/admin/EventsAdmin";
import { ResultsAdmin } from "../../components/admin/ResultsAdmin";

export default function AdminPage() {
  const [tab, setTab] = useState("announcements");

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">⚙️ SIDLAK Admin Panel</h1>

      <div className="flex gap-4 mb-6">
        {["announcements", "departments", "events", "results"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg font-semibold ${
              tab === t ? "bg-yellow-400 text-black" : "bg-gray-800 text-white"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* {tab === "announcements" && <AnnouncementsAdmin />} */}
      {tab === "departments" && <DepartmentsAdmin />}
      {tab === "events" && <EventsAdmin />}
      {tab === "results" && <ResultsAdmin />}
    </div>
  );
}

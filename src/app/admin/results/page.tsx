"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils//supabase/client";
import Link from "next/link";
import SingleSelectDropdown from "../../../components/SingleSelectDropdown";
import Breadcrumbs from "../../../components/Breadcrumbs";
import toast, { Toaster } from 'react-hot-toast';

interface Department {
  id: string;
  name: string;
  image_url?: string;
}
interface Event {
  id: string;
  name: string;
  icon?: string;
  category?: string | null;
}

export default function AddResultPage() {
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [medalType, setMedalType] = useState("gold");
  const [message, setMessage] = useState("");

  const supabase = createClient();

  useEffect(() => {
    fetchDropdownData();
  }, []);

  async function fetchDropdownData() {
    const { data: deptData } = await supabase.from("departments").select("id, name, image_url");
    const { data: eventData } = await supabase.from("events").select("id, name, icon, category").order("category,name");
    if (deptData) setDepartments(deptData);
    if (eventData) setEvents(eventData);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!eventId || !departmentId) {
      setMessage("❌ Please select both an event and a department.");
      return;
    }

    // Calculate points based on medal type
    let calculatedPoints = 0;
    if (medalType === "gold") calculatedPoints = 1;
    else if (medalType === "silver") calculatedPoints = 0.20;
    else if (medalType === "bronze") calculatedPoints = 0.04;
    const { error } = await supabase.from("results").insert([
      {
        event_id: eventId,
        department_id: departmentId,
        medal_type: medalType,
        points: calculatedPoints,
      },
    ]);
    if (error) setMessage(error.message);
    else {
      setMessage("✅ Result added successfully!");
      setEventId("");
      setDepartmentId("");
      setMedalType("gold");
    }
  }

  const groupedEvents = useMemo(() => {
    if (!events.length) return [];

    const groups: { [key: string]: Event[] } = events.reduce((acc, event) => {
      const category = event.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(event);
      return acc;
    }, {} as { [key: string]: Event[] });

    return Object.entries(groups).map(([category, events]) => ({
      label: category, options: events
    }));
  }, [events]);
  

  return (
    <div className="max-w-2xl mx-auto">
      <Breadcrumbs items={[{ href: '/admin/dashboard', label: 'Dashboard' }, { label: 'Add Result' }]} />
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-monument-green mb-2">➕ Add Result</h1>
          <p className="text-gray-600">Record competition results and award medals to departments</p>
        </div>
        <Link href="/admin/results/manage" className="btn btn-secondary">
          Manage Results
        </Link>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-800">Competition Result Form</h2>
        </div>
        
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Event</label>
          <SingleSelectDropdown
            options={groupedEvents}
            selectedValue={eventId}
            onChange={setEventId}
            placeholder="Select Event"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
          <SingleSelectDropdown
            options={departments}
            selectedValue={departmentId}
            onChange={setDepartmentId}
            placeholder="Select Department"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Medal Type</label>
          <div className="grid grid-cols-3 gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="gold"
              checked={medalType === "gold"}
              onChange={(e) => setMedalType(e.target.value)}
              className="text-monument-green focus:ring-monument-green"
            />
            <span className="badge badge-gold">🥇 Gold (1 pt)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="silver"
              checked={medalType === "silver"}
              onChange={(e) => setMedalType(e.target.value)}
              className="text-monument-green focus:ring-monument-green"
            />
            <span className="badge badge-silver">🥈 Silver (0.20 pt)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="bronze"
              checked={medalType === "bronze"}
              onChange={(e) => setMedalType(e.target.value)}
              className="text-monument-green focus:ring-monument-green"
            />
            <span className="badge badge-bronze">🥉 Bronze (0.04 pt)</span>
          </label>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full text-lg py-3"
        >
          🏆 Submit Result
        </button>
      </form>

      {message && (
        <div className={`mt-6 p-4 rounded-lg text-center ${
          message.includes('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <p className="font-medium">{message}</p>
        </div>
      )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/utils//supabase/client";
import Link from "next/link";
import SingleSelectDropdown from "../../../components/SingleSelectDropdown";
import Breadcrumbs from "../../../components/Breadcrumbs";

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

interface Category {
  id: string;
  name: string;
}

export default function AddResultPage() {
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [medalType, setMedalType] = useState("gold");
  const [message, setMessage] = useState("");

  const supabase = createClient();

  const fetchDropdownData = useCallback(async () => {
    const { data: deptData } = await supabase.from("departments").select("id, name, image_url");
    const { data: eventData } = await supabase.from("events").select("id, name, icon, category").order("category,name");
    const { data: categoriesData } = await supabase.from("categories").select("id, name");
    if (deptData) setDepartments(deptData);
    if (eventData) setEvents(eventData);
    if (categoriesData) setAllCategories(categoriesData);
  }, [supabase]);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

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
    if (!events.length || !allCategories.length) return [];

    const categoryMap = new Map(allCategories.map(c => [c.id, c.name]));

    const groups: { [key: string]: Event[] } = events.reduce((acc, event) => {
      const categoryName = event.category ? categoryMap.get(event.category) || "Uncategorized" : "Uncategorized";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(event);
      return acc;
    }, {} as { [key: string]: Event[] });

    return Object.entries(groups).map(([category, events]) => ({
      label: category, options: events
    }));
  }, [events, allCategories]);
  

  return (
    <div className="max-w-2xl mx-auto dark:text-gray-200">
      <Breadcrumbs items={[{ href: '/admin/dashboard', label: 'Dashboard' }, { label: 'Add Result' }]} />
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-monument-green mb-2 dark:text-green-400">➕ Add Result</h1>
          <p className="text-gray-600 dark:text-gray-400">Record competition results and award medals to departments</p>
        </div>
        <Link href="/admin/results/manage" className="btn btn-secondary dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200">
          Manage Results
        </Link>
      </div>
      
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <div className="card-header dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Competition Result Form</h2>
        </div>
        
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Event</label>
          <SingleSelectDropdown
            options={groupedEvents}
            selectedValue={eventId}
            onChange={setEventId}
            placeholder="Select Event"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Department</label>
          <SingleSelectDropdown
            options={departments}
            selectedValue={departmentId}
            onChange={setDepartmentId}
            placeholder="Select Department"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 dark:text-gray-300">Medal Type</label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-lg dark:bg-gray-900">
            <button
              type="button"
              onClick={() => setMedalType('gold')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${medalType === 'gold' ? 'bg-yellow-400 text-yellow-900 shadow-sm font-bold' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700/50'}`}
            >
              🥇 Gold
            </button>
            <button
              type="button"
              onClick={() => setMedalType('silver')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${medalType === 'silver' ? 'bg-gray-300 text-gray-800 shadow-sm font-bold dark:bg-gray-500 dark:text-gray-100' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700/50'}`}
            >
              🥈 Silver
            </button>
            <button
              type="button"
              onClick={() => setMedalType('bronze')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${medalType === 'bronze' ? 'bg-orange-400 text-orange-900 shadow-sm font-bold' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700/50'}`}
            >
              🥉 Bronze
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full text-lg py-3 dark:bg-green-600 dark:hover:bg-green-700"
        >
          🏆 Submit Result
        </button>
      </form>

      {message && (
        <div className={`mt-6 p-4 rounded-lg text-center ${message.includes('✅')
            ? 'bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300'
            : 'bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/50 dark:border-red-700 dark:text-red-300'
        }`}>
          <p className="font-medium">{message}</p>
        </div>
      )}
      </div>
    </div>
  );
}
"use client";

import React from 'react';

import { useState, useEffect } from "react";
import { supabase } from "../../../../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import toast, { Toaster } from 'react-hot-toast';

interface Department {
  id: string;
  name: string;
}
interface Event {
  id: string;
  name: string;
}




export default function Page({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [medalType, setMedalType] = useState("gold");
  const [points, setPoints] = useState(1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDropdownData();
    fetchResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchDropdownData() {
    const { data: deptData } = await supabase.from("departments").select("id, name");
    const { data: eventData } = await supabase.from("events").select("id, name");
    if (deptData) setDepartments(deptData);
    if (eventData) setEvents(eventData);
  }

  async function fetchResult() {
    setLoading(true);
    const { data, error } = await supabase
      .from("results")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching result:", error);
      setMessage("Error fetching result.");
      setLoading(false);
      return;
    }

    if (data) {
      setEventId(data.event_id);
      setDepartmentId(data.department_id);
      setMedalType(data.medal_type);
      setPoints(data.points);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase
      .from("results")
      .update({
        event_id: eventId,
        department_id: departmentId,
        medal_type: medalType,
        points: points,
      })
      .eq("id", id);

    if (error) {
      toast.error(`Error updating result: ${error.message}`);
    } else {
      toast.success("Result updated successfully!");
      router.push("/admin/results/manage"); // Redirect back to manage page
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto mt-10 text-center">
        <p>Loading result...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-monument-green mb-2">✏️ Edit Result</h1>
        <p className="text-gray-600">Modify the details of this competition result</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-800">Edit Result Form</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="input"
              required
            >
              <option value="">Select Event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="input"
              required
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Medal Type</label>
            <div className="grid grid-cols-3 gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="gold"
                  checked={medalType === "gold"}
                  onChange={(e) => {
                    setMedalType(e.target.value);
                    setPoints(1); // Update points based on medal type
                  }}
                  className="text-monument-green focus:ring-monument-green"
                />
                <span className="badge badge-gold">🥇 Gold (1 pt)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="silver"
                  checked={medalType === "silver"}
                  onChange={(e) => {
                    setMedalType(e.target.value);
                    setPoints(0.20); // Update points based on medal type
                  }}
                  className="text-monument-green focus:ring-monument-green"
                />
                <span className="badge badge-silver">🥈 Silver (0.20 pt)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="bronze"
                  checked={medalType === "bronze"}
                  onChange={(e) => {
                    setMedalType(e.target.value);
                    setPoints(0.04); // Update points based on medal type
                  }}
                  className="text-monument-green focus:ring-monument-green"
                />
                <span className="badge badge-bronze">🥉 Bronze (0.04 pt)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="input"
              placeholder="Points"
              required
              min="0"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full text-lg py-3"
          >
            💾 Update Result
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
    <Toaster />
    </div>
  );
}
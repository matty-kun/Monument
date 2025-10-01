"use client";

import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface Event {
  id: string;
  name: string;
  departments: string[];
  location: string;
  time: string;
  date: string;
  status: 'upcoming' | 'ongoing' | 'finished';
}

const SchedulePage: NextPage = () => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    const { data, error } = await supabase.from("schedules").select("*").order("date");
    if (!error && data) {
      setEvents(data as Event[]);
    }
  }

  return (
    <div>
      <div className="mb-8">
  <h1 className="text-4xl font-bold text-monument-green mb-2">🗓️ Schedule</h1>
        <p className="text-gray-600">Upcoming, ongoing, and finished events</p>
      </div>

      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="table-cell text-left font-semibold">Event Name</th>
                <th className="table-cell text-left font-semibold">Competing Departments</th>
                <th className="table-cell text-left font-semibold">Location</th>
                <th className="table-cell text-left font-semibold">Time</th>
                <th className="table-cell text-left font-semibold">Date</th>
                <th className="table-cell text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="table-row animate-fadeIn">
                  <td className="table-cell">{event.name}</td>
                  <td className="table-cell">{event.departments.join(', ')}</td>
                  <td className="table-cell">{event.location}</td>
                  <td className="table-cell">{event.time}</td>
                  <td className="table-cell">{event.date}</td>
                  <td className="table-cell text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-white ${
                        event.status === 'upcoming'
                          ? 'bg-yellow-500'
                          : event.status === 'ongoing'
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                    >
                      {event.status}
                    </span>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    No events scheduled yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;

"use client";

import React, { Fragment } from "react";
import type { NextPage } from "next";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabaseClient';

interface Department {
  id: string;
  name: string;
  image_url?: string;
}

interface Event {
  id: string;
  name: string;
  departments: (string | Department)[]; // Can be string initially, then enriched to Department
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
    const { data: eventsData, error: eventsError } = await supabase.from("schedules").select("*").order("date");

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      return;
    }

    if (eventsData) {
      // Collect all unique department names from all events
      const allDepartmentNames = Array.from(new Set(eventsData.flatMap(event => event.departments)));

      if (allDepartmentNames.length === 0) {
        setEvents(eventsData as Event[]); // No departments to fetch, set events directly
        return;
      }

      // Fetch all departments that match the names
      const { data: departmentsData, error: departmentsError } = await supabase
        .from("departments")
        .select("id, name, image_url")
        .in("name", allDepartmentNames);

      if (departmentsError) {
        console.error("Error fetching departments:", departmentsError);
        return;
      }

      // Create a map from department name to department object
      const departmentMap = new Map(departmentsData.map((department: Department) => [department.name, department]));

      // Map department details back to events
      const enrichedEvents = eventsData.map(event => ({
        ...event,
        // Use the department name to look up the full department object
        departments: event.departments.map((deptName: string) => departmentMap.get(deptName)).filter((department: Department | undefined): department is Department => department !== undefined),
      }));

      setEvents(enrichedEvents as Event[]);
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
                  <td className="table-cell font-medium">{event.name}</td>
                  <td className="table-cell">
                    <div className="flex flex-wrap items-center gap-2">
                      {(event.departments as Department[]).map((department, index) => (
                        <Fragment key={department.id}>
                          <div className="flex items-center" title={department.name}>
                            {department.image_url ? (
                              <Image
                                src={department.image_url}
                                alt={department.name}
                                width={32}
                                height={32}
                                className="w-8 h-8 object-cover rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                                {department.name.substring(0, 3)}
                              </div>
                            )}
                          </div>
                          {index < event.departments.length - 1 && (
                            <span className="font-bold text-gray-400">vs</span>
                          )}
                        </Fragment>
                      ))}
                    </div>
                  </td>
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

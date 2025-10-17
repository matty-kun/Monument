"use client";

import React, { Fragment, useCallback } from "react";
import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';

interface Department {
  id: string;
  name: string;
  image_url?: string;
}

interface Schedule {
  id: string;
  event_id: string;
  venue_id: string;
  events: { name: string; icon: string | null } | null;
  venues: { name: string } | null;
  departments: (Department | string)[];
  time: string;
  date: string;
  status: 'upcoming' | 'ongoing' | 'finished';
}

const SchedulePage: NextPage = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [allEvents, setAllEvents] = useState<{id: string, name: string, icon: string | null}[]>([]);
  const [allVenues, setAllVenues] = useState<{id: string, name: string}[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [venueFilter, setVenueFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");
  const [timeFromFilter, setTimeFromFilter] = useState<string>("");
  const [timeToFilter, setTimeToFilter] = useState<string>("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const supabase = createClient();

  const fetchEvents = useCallback(async () => {
    // Fetch schedules and the related event name in a single query
    const { data: schedulesData, error: schedulesError } = await supabase
      .from("schedules")
      .select(`
        id,
        time,
        date,
        status,
        departments,
        events ( name, icon ),
        venues ( name )
      `)
      .order("date");

    if (schedulesError) {
      console.error("Error fetching schedules:", schedulesError);
      return;
    }

    if (schedulesData) {
      const allDepartmentNames = Array.from(new Set(schedulesData.flatMap(s => s.departments)));

      if (allDepartmentNames.length === 0) {
        setSchedules(schedulesData as unknown as Schedule[]);
        return;
      }

      const { data: departmentsData, error: departmentsError } = await supabase
        .from("departments")
        .select("id, name, image_url")
        .in("name", allDepartmentNames);

      if (departmentsError) {
        console.error("Error fetching departments:", departmentsError, "Serving schedules with department names only.");
        setSchedules(schedulesData as unknown as Schedule[]);
        return;
      }

      const departmentMap = new Map(departmentsData.map((department: Department) => [department.name, department]));

      const enrichedSchedules = schedulesData.map(schedule => ({
        ...schedule,
        departments: (schedule.departments || [])
          .map((deptName: string) => departmentMap.get(deptName) || deptName)
      }));

      setSchedules(enrichedSchedules as unknown as Schedule[]);
      setFilteredSchedules(enrichedSchedules as unknown as Schedule[]);
      setAllDepartments(departmentsData);
    }
  }, [supabase]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    // Fetch all events
    const { data: eventsData } = await supabase
      .from("events")
      .select("id, name, icon")
      .order("name");

    // Fetch all venues
    const { data: venuesData } = await supabase
      .from("venues")
      .select("id, name")
      .order("name");

    if (eventsData) setAllEvents(eventsData);
    if (venuesData) setAllVenues(venuesData);
  }, [supabase]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Filter schedules based on selected filters
  useEffect(() => {
    let filtered = [...schedules];

    if (statusFilter !== "all") {
      filtered = filtered.filter(schedule => schedule.status === statusFilter);
    }

    if (eventFilter !== "all") {
      filtered = filtered.filter(schedule => schedule.event_id === eventFilter);
    }

    if (venueFilter !== "all") {
      filtered = filtered.filter(schedule => schedule.venue_id === venueFilter);
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter(schedule => 
        schedule.departments.some(dept => 
          typeof dept === 'string' ? dept === departmentFilter : dept.name === departmentFilter
        )
      );
    }

    if (dateFromFilter) {
      filtered = filtered.filter(schedule => schedule.date >= dateFromFilter);
    }

    if (dateToFilter) {
      filtered = filtered.filter(schedule => schedule.date <= dateToFilter);
    }

    if (timeFromFilter) {
      filtered = filtered.filter(schedule => schedule.time >= timeFromFilter);
    }

    if (timeToFilter) {
      filtered = filtered.filter(schedule => schedule.time <= timeToFilter);
    }

    setFilteredSchedules(filtered);
  }, [schedules, statusFilter, eventFilter, venueFilter, departmentFilter, dateFromFilter, dateToFilter, timeFromFilter, timeToFilter]);

  const clearFilters = () => {
    setStatusFilter("all");
    setEventFilter("all");
    setVenueFilter("all");
    setDepartmentFilter("all");
    setDateFromFilter("");
    setDateToFilter("");
    setTimeFromFilter("");
    setTimeToFilter("");
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 dark:text-gray-200">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-monument-green mb-2 dark:text-green-400">🗓️ Schedule</h1>
        <p className="text-gray-600 dark:text-gray-400">Upcoming, ongoing, and finished events</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center dark:bg-blue-900/50">
                <span className="text-blue-600 text-sm dark:text-blue-300">🔍</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Filters</h3>
            </div>
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors duration-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"
            >
              Clear All
            </button>
          </div>
          <button 
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <span className="text-xs dark:text-gray-400">
              {isFiltersOpen ? '▼' : '▶'}
            </span>
            {isFiltersOpen ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
        
        {isFiltersOpen && (
          <div className="p-4 animate-fadeIn dark:bg-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="finished">Finished</option>
            </select>
          </div>

          {/* Event Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Event</label>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              <option value="all">All Events</option>
              {allEvents.map(event => (
                <option key={event.id} value={event.id}>
                  {event.icon} {event.name}
                </option>
              ))}
            </select>
          </div>

          {/* Venue Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Venue</label>
            <select
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
              className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              <option value="all">All Venues</option>
              {allVenues.map(venue => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              <option value="all">All Departments</option>
              {allDepartments.map(dept => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Date From</label>
            <input
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Date To</label>
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
          </div>

          {/* Time Range Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Time From</label>
            <input
              type="time"
              value={timeFromFilter}
              onChange={(e) => setTimeFromFilter(e.target.value)}
              className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Time To</label>
            <input
              type="time"
              value={timeToFilter}
              onChange={(e) => setTimeToFilter(e.target.value)}
              className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
          </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md dark:bg-gray-700 dark:text-gray-400">
              📊 Showing {filteredSchedules.length} of {schedules.length} events
            </div>
          </div>
        )}
      </div>

      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead className="table-header bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
              <tr>
                <th className="table-cell text-left font-semibold">Event Name</th>
                <th className="table-cell text-left font-semibold">Competing Departments</th>
                <th className="table-cell text-left font-semibold">Venue</th>
                <th className="table-cell text-left font-semibold">Time</th>
                <th className="table-cell text-left font-semibold">Date</th>
                <th className="table-cell text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSchedules.map((schedule) => (
                <tr key={schedule.id} className="table-row animate-fadeIn dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700/50">
                  <td className="table-cell font-medium">
                    <div className="flex items-center gap-2">
                      {schedule.events?.icon && (
                        <span className="text-xl">{schedule.events.icon}</span>
                      )}
                      <span>{schedule.events?.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-wrap items-center gap-2">
                      {schedule.departments.map((department, index) => (
                        <Fragment key={typeof department === 'string' ? department : department.id}>
                          <div className="flex items-center" title={typeof department === 'string' ? department : department.name}>
                            {typeof department === 'object' && department.image_url ? (
                              <Image
                                src={department.image_url}
                                alt={department.name}
                                width={32}
                                height={32}
                                className="w-8 h-8 object-cover rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 dark:bg-gray-600 dark:text-gray-300">
                                {typeof department === 'string' ? department.substring(0, 2) : department.name.substring(0, 2)}
                              </div>
                            )}
                          </div>
                          {index < schedule.departments.length - 1 && (
                            <span className="font-bold text-gray-400 dark:text-gray-500">vs</span>
                          )}
                        </Fragment>
                      ))}
                    </div>
                  </td>
                  <td className="table-cell">{schedule.venues?.name || 'N/A'}</td>
                  <td className="table-cell">{schedule.time}</td>
                  <td className="table-cell">{schedule.date}</td>
                  <td className="table-cell text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        schedule.status === 'upcoming'
                          ? 'bg-yellow-500'
                          : schedule.status === 'ongoing'
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                    >
                      {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredSchedules.length === 0 && (
                <tr className="dark:bg-gray-800">
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    {schedules.length === 0 
                      ? "No events scheduled yet." 
                      : "No events match the current filters. Try adjusting your filter criteria."}
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
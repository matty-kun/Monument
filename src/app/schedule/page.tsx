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

interface Schedule {
  id: string;
  event_id: string;
  location_id: string;
  events: { name: string; icon: string | null } | null;
  locations: { name: string } | null;
  departments: (Department | string)[];
  time: string;
  date: string;
  status: 'upcoming' | 'ongoing' | 'finished';
}

const SchedulePage: NextPage = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [allEvents, setAllEvents] = useState<{id: string, name: string, icon: string | null}[]>([]);
  const [allLocations, setAllLocations] = useState<{id: string, name: string}[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");
  const [timeFromFilter, setTimeFromFilter] = useState<string>("");
  const [timeToFilter, setTimeToFilter] = useState<string>("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
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
        locations ( name )
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
  }

  // Fetch filter options
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  async function fetchFilterOptions() {
    // Fetch all events
    const { data: eventsData } = await supabase
      .from("events")
      .select("id, name, icon")
      .order("name");

    // Fetch all locations
    const { data: locationsData } = await supabase
      .from("locations")
      .select("id, name")
      .order("name");

    if (eventsData) setAllEvents(eventsData);
    if (locationsData) setAllLocations(locationsData);
  }

  // Filter schedules based on selected filters
  useEffect(() => {
    let filtered = [...schedules];

    if (statusFilter !== "all") {
      filtered = filtered.filter(schedule => schedule.status === statusFilter);
    }

    if (eventFilter !== "all") {
      filtered = filtered.filter(schedule => schedule.event_id === eventFilter);
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter(schedule => schedule.location_id === locationFilter);
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
  }, [schedules, statusFilter, eventFilter, locationFilter, departmentFilter, dateFromFilter, dateToFilter, timeFromFilter, timeToFilter]);

  const clearFilters = () => {
    setStatusFilter("all");
    setEventFilter("all");
    setLocationFilter("all");
    setDepartmentFilter("all");
    setDateFromFilter("");
    setDateToFilter("");
    setTimeFromFilter("");
    setTimeToFilter("");
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-monument-green mb-2">🗓️ Schedule</h1>
        <p className="text-gray-600">Upcoming, ongoing, and finished events</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">🔍</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
            </div>
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors duration-200"
            >
              Clear All
            </button>
          </div>
          <button 
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 border border-gray-200"
          >
            <span className="text-xs">
              {isFiltersOpen ? '▼' : '▶'}
            </span>
            {isFiltersOpen ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
        
        {isFiltersOpen && (
          <div className="p-4 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="finished">Finished</option>
            </select>
          </div>

          {/* Event Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="all">All Events</option>
              {allEvents.map(event => (
                <option key={event.id} value={event.id}>
                  {event.icon} {event.name}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="all">All Locations</option>
              {allLocations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full border rounded px-3 py-2"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Time Range Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time From</label>
            <input
              type="time"
              value={timeFromFilter}
              onChange={(e) => setTimeFromFilter(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time To</label>
            <input
              type="time"
              value={timeToFilter}
              onChange={(e) => setTimeToFilter(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
              📊 Showing {filteredSchedules.length} of {schedules.length} events
            </div>
          </div>
        )}
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
              {filteredSchedules.map((schedule) => (
                <tr key={schedule.id} className="table-row animate-fadeIn">
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
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                                {typeof department === 'string' ? department.substring(0, 2) : department.name.substring(0, 2)}
                              </div>
                            )}
                          </div>
                          {index < schedule.departments.length - 1 && (
                            <span className="font-bold text-gray-400">vs</span>
                          )}
                        </Fragment>
                      ))}
                    </div>
                  </td>
                  <td className="table-cell">{schedule.locations?.name || 'N/A'}</td>
                  <td className="table-cell">{schedule.time}</td>
                  <td className="table-cell">{schedule.date}</td>
                  <td className="table-cell text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-white ${
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
                <tr>
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

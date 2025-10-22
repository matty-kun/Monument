"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Fragment,
} from "react";
import type { NextPage } from "next";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import BouncingBallsLoader from "@/components/BouncingBallsLoader";

interface Department {
  id: string;
  name: string;
  image_url?: string;
}

interface Event {
  id?: string;
  name: string;
  icon: string | null;
}

interface Venue {
  id?: string;
  name: string;
}

interface Schedule {
  id: string;
  event_id: string;
  venue_id: string;
  events: Event | null;
  venues: Venue | null;
  departments: (Department | string)[];
  start_time: string;
  end_time: string;
  date: string;
  status: "upcoming" | "ongoing" | "finished";
}

// Type for the raw data from Supabase before normalization
type RawScheduleFromSupabase = Omit<
  Schedule,
  "events" | "venues" | "departments"
> & {
  // Supabase might return an array for relationships, even if it's one-to-one
  events: Event | Event[] | null;
  venues: Venue | Venue[] | null;
  // Departments are initially just an array of names (strings)
  departments: string[];
};

const supabase = createClient();

const SchedulePage: NextPage = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [venueFilter, setVenueFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [timeFromFilter, setTimeFromFilter] = useState("");
  const [timeToFilter, setTimeToFilter] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // ✅ Fetch schedules
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("schedules")
      .select(
        `
        id,
        event_id,
        venue_id,
        start_time,
        end_time,
        date,
        status,
        departments,
        events ( name, icon ),
        venues ( name )
      `
      )
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching schedules:", error);
      setLoading(false);
      return;
    }

    if (data) {
      // Normalize event/venue structure (flatten arrays)
      const normalized = data.map((s: RawScheduleFromSupabase) => ({
        ...s,
        events: Array.isArray(s.events) ? s.events[0] || null : s.events || null,
        venues: Array.isArray(s.venues) ? s.venues[0] || null : s.venues || null,
      }));

      // Collect department names
      const allDeptNames = Array.from(
        new Set(normalized.flatMap((s) => s.departments))
      );

      if (allDeptNames.length === 0) {
        setSchedules(normalized as Schedule[]);
        setFilteredSchedules(normalized as Schedule[]);
        setLoading(false);
        return;
      }

      const { data: deptData, error: deptError } = await supabase
        .from("departments")
        .select("id, name, image_url")
        .in("name", allDeptNames);

      if (deptError) {
        console.warn("Error fetching departments:", deptError);
        setSchedules(normalized as Schedule[]);
        setFilteredSchedules(normalized as Schedule[]);
        setLoading(false);
        return;
      }

      const deptMap = new Map(deptData.map((d) => [d.name, d]));
      const enriched = normalized.map((sched) => ({
        ...sched,
        departments: sched.departments.map(
          (name: string) => deptMap.get(name) || name
        ),
      }));

      setSchedules(enriched as Schedule[]);
      setFilteredSchedules(enriched as Schedule[]);
      setAllDepartments(deptData);
    }
    setLoading(false);
  }, []);

  // ✅ Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    const [{ data: events }, { data: venues }] = await Promise.all([
      supabase.from("events").select("id, name, icon").order("name"),
      supabase.from("venues").select("id, name").order("name"),
    ]);

    if (events) setAllEvents(events);
    if (venues) setAllVenues(venues);
  }, []);

  // Run on mount
  useEffect(() => {
    fetchSchedules();
    fetchFilterOptions();
  }, [fetchSchedules, fetchFilterOptions]);

  // ✅ Dynamic status
  const getDynamicStatus = useCallback((schedule: Schedule) => {
    if (!schedule.date || !schedule.start_time) {
      return { status: "upcoming", label: "Upcoming" };
    }

    const now = new Date();
    const start = new Date(`${schedule.date}T${schedule.start_time}`);
    const end = new Date(`${schedule.date}T${schedule.end_time}`);

    if (isNaN(start.getTime())) return { status: "upcoming", label: "Upcoming" };

    if (now < start) return { status: "upcoming", label: "Upcoming" };
    if (now >= start && now <= end)
      return { status: "ongoing", label: "Ongoing" };
    return { status: "finished", label: "Finished" };
  }, []);

  // ✅ Re-filter
  useEffect(() => {
    let filtered = [...schedules];

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (s) => getDynamicStatus(s).status === statusFilter
      );
    }

    if (eventFilter !== "all") {
      filtered = filtered.filter((s) => s.event_id === eventFilter);
    }

    if (venueFilter !== "all") {
      filtered = filtered.filter((s) => s.venue_id === venueFilter);
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter((s) =>
        s.departments.some((d) =>
          typeof d === "string" ? d === departmentFilter : d.name === departmentFilter
        )
      );
    }

    if (dateFromFilter) filtered = filtered.filter((s) => s.date >= dateFromFilter);
    if (dateToFilter) filtered = filtered.filter((s) => s.date <= dateToFilter);
    if (timeFromFilter) filtered = filtered.filter((s) => s.start_time >= timeFromFilter);
    if (timeToFilter) filtered = filtered.filter((s) => s.end_time <= timeToFilter);

    setFilteredSchedules(filtered);
  }, [
    schedules,
    statusFilter,
    eventFilter,
    venueFilter,
    departmentFilter,
    dateFromFilter,
    dateToFilter,
    timeFromFilter,
    timeToFilter,
    getDynamicStatus,
  ]);

  // ✅ Clear filters
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

  const filterCount = useMemo(() => filteredSchedules.length, [filteredSchedules]);
  const totalCount = useMemo(() => schedules.length, [schedules]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <BouncingBallsLoader />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 dark:text-gray-200 p-6 rounded-lg">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-monument-green dark:text-green-400 mb-2">
          🗓️ Schedule
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View upcoming, ongoing, and finished events
        </p>
      </div>

      {/* ---------- FILTERS ---------- */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔍</span>
            <h3 className="font-semibold text-lg">Filters</h3>
            <button
              onClick={clearFilters}
              className="ml-4 px-3 py-1 text-sm text-red-600 bg-red-50 rounded-md hover:bg-red-100 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"
            >
              Clear All
            </button>
          </div>
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="text-sm border px-3 py-2 rounded-md hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            {isFiltersOpen ? "Hide Filters ▲" : "Show Filters ▼"}
          </button>
        </div>

        {isFiltersOpen && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded border px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="all">All</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="finished">Finished</option>
              </select>
            </div>

            {/* Event */}
            <div>
              <label className="block text-sm font-medium mb-1">Event</label>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="w-full rounded border px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="all">All Events</option>
                {allEvents.map((e) => (
                  <option key={e.id || e.name} value={e.id}>
                    {e.icon} {e.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Venue */}
            <div>
              <label className="block text-sm font-medium mb-1">Venue</label>
              <select
                value={venueFilter}
                onChange={(e) => setVenueFilter(e.target.value)}
                className="w-full rounded border px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="all">All Venues</option>
                {allVenues.map((v) => (
                  <option key={v.id || v.name} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full rounded border px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="all">All Departments</option>
                {allDepartments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium mb-1">Date From</label>
              <input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                className="w-full rounded border px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date To</label>
              <input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                className="w-full rounded border px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium mb-1">Time From</label>
              <input
                type="time"
                value={timeFromFilter}
                onChange={(e) => setTimeFromFilter(e.target.value)}
                className="w-full rounded border px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Time To</label>
              <input
                type="time"
                value={timeToFilter}
                onChange={(e) => setTimeToFilter(e.target.value)}
                className="w-full rounded border px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-500 mb-4 dark:text-gray-400">
        📊 Showing {filterCount} of {totalCount} events
      </div>

      {/* ---------- TABLE ---------- */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Event</th>
              <th className="px-4 py-2 text-left font-semibold">Departments</th>
              <th className="px-4 py-2 text-left font-semibold">Venue</th>
              <th className="px-4 py-2 text-left font-semibold">Time</th>
              <th className="px-4 py-2 text-left font-semibold">Date</th>
              <th className="px-4 py-2 text-center font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredSchedules.length > 0 ? (
              filteredSchedules.map((s) => {
                const { status, label } = getDynamicStatus(s);
                const color =
                  status === "upcoming"
                    ? "bg-yellow-500"
                    : status === "ongoing"
                    ? "bg-green-500 animate-pulse"
                    : "bg-red-500";

                return (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        {s.events?.icon && <span>{s.events.icon}</span>}
                        <span>{s.events?.name || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        {s.departments.map((d, i) => (
                          <Fragment key={typeof d === "string" ? d : d.id}>
                            {typeof d === "object" && d.image_url ? (
                              <Image
                                src={d.image_url}
                                alt={d.name}
                                width={32}
                                height={32}
                                className="rounded-full w-8 h-8 object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600 text-xs font-bold">
                                {typeof d === "string" ? d.slice(0, 2) : d.name.slice(0, 2)}
                              </div>
                            )}
                            {i < s.departments.length - 1 && (
                              <div className="h-8 flex items-center justify-center">
                                <span className="text-gray-400 font-bold">vs</span>
                              </div>
                            )}
                          </Fragment>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2">{s.venues?.name || "N/A"}</td>
                    <td className="px-4 py-2">
                      {s.start_time} - {s.end_time}
                    </td>
                    <td className="px-4 py-2">{s.date}</td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs text-white font-semibold ${color}`}
                      >
                        {label}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-gray-500 dark:text-gray-400"
                >
                  🗓️ No events found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SchedulePage;

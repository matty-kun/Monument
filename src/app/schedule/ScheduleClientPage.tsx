"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Fragment,
} from "react";
import Image from "next/image";import { CardContent } from "@/components/ui/Card";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTable, FaThLarge } from "react-icons/fa";
import SingleSelectDropdown from "@/components/SingleSelectDropdown";
import { motion, AnimatePresence } from "framer-motion";
import { formatTime } from "@/lib/utils";

interface Department {
  id: string;
  name: string;
  abbreviation?: string | null;
  image_url?: string;
}

interface Event {
  id: string;
  name: string;
  abbreviation?: string;
  icon: string | null;
  category: string | { name: string } | null; // Allow string for UUID
  division: string | null;
  gender: string | null;
}

interface Category {
  id: string;
  name: string;
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

type ScheduleStatus = "ongoing" | "upcoming" | "finished";

interface ScheduleClientPageProps {
    initialSchedules: Schedule[];
    initialEvents: Event[];
    initialVenues: Venue[];
    initialCategories: Category[];
    initialDepartments: Department[];
}

export default function ScheduleClientPage({ 
    initialSchedules, 
    initialEvents, 
    initialVenues, 
    initialCategories,
    initialDepartments
}: ScheduleClientPageProps) {
  const [schedules] = useState<Schedule[]>(initialSchedules);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>(initialSchedules);
  const [allEvents] = useState<Event[]>(initialEvents);
  const [allVenues] = useState<Venue[]>(initialVenues);
  const [allDepartments] = useState<Department[]>(initialDepartments);
  const [allCategories] = useState<Category[]>(initialCategories);
  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [venueFilter, setVenueFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [timeFromFilter, setTimeFromFilter] = useState("");
  const [timeToFilter, setTimeToFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card'); // New state for view mode
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // ✅ Dynamic status
  const getDynamicStatus = useCallback((schedule: Schedule): { status: ScheduleStatus; label: string; color: string; icon: string } => {
    if (!schedule.date || !schedule.start_time || !schedule.end_time)
      return {
        status: "upcoming",
        label: "Upcoming",
        color: "bg-yellow-500",
        icon: "⏳",
      };

    const now = new Date();
    const start = new Date(`${schedule.date}T${schedule.start_time}`);
    const end = new Date(`${schedule.date}T${schedule.end_time}`);

    if (isNaN(start.getTime()))
      return {
        status: "upcoming",
        label: "Upcoming",
        color: "bg-yellow-500",
        icon: "⏳",
      };

    if (now < start)
      return {
        status: "upcoming",
        label: "Upcoming",
        color: "bg-yellow-500",
        icon: "⏳",
      };
    if (now >= start && now <= end)
      return {
        status: "ongoing",
        label: "Live Now",
        color: "bg-green-500 animate-pulse",
        icon: "🔴",
      };
    return { status: "finished", label: "Finished", color: "bg-red-500", icon: "✅" };
  }, []);

  const getCategoryName = useCallback((categoryId: string | { name: string } | null | undefined) => {
    if (!categoryId) return null;
    if (typeof categoryId === 'object' && categoryId !== null && 'name' in categoryId) {
      return categoryId.name;
    }
    return allCategories.find(c => c.id === categoryId)?.name || categoryId.toString();
  }, [allCategories]);

  // ✅ Re-filter
  useEffect(() => {
    let filtered: Schedule[] = [...schedules];

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((s) => {
        const eventName = s.events?.name?.toLowerCase() || '';
        const departmentNames = s.departments.map(d => (typeof d === 'string' ? d.toLowerCase() : d.name.toLowerCase()));
        const categoryName = getCategoryName(s.events?.category)?.toLowerCase() || '';

        return (
          eventName.includes(lowercasedQuery) ||
          departmentNames.some(dn => dn.includes(lowercasedQuery)) ||
          categoryName.includes(lowercasedQuery)
        );
      });
    }

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
    searchQuery,
    statusFilter,
    eventFilter,
    venueFilter,
    departmentFilter,
    dateFromFilter,
    dateToFilter,
    timeFromFilter,
    timeToFilter,
    getDynamicStatus,
    getCategoryName,
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
  const clearAll = () => { clearFilters(); setSearchQuery(""); };

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBA";
    // Adding T00:00:00 ensures the date isn't affected by timezone shifts
    const date = new Date(dateString + 'T00:00:00');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  };

  const filterCount = useMemo(() => filteredSchedules.length, [filteredSchedules]);
  const totalCount = useMemo(() => schedules.length, [schedules]);

  // Helper to format the full event name for display
  const formatEventName = useCallback((event: Event) => {
    if (!event) return 'N/A';
    const parts = [event.name];
    if (event.division && event.division !== 'N/A') parts.push(`(${event.division})`);
    if (event.gender && event.gender !== 'N/A') parts.push(`- ${event.gender}`);
    return parts.join(' ');
  }, []);

  const groupedEvents = useMemo(() => {
    if (!allEvents.length || !allCategories.length) return [];
    const groups: { [key: string]: Event[] } = allEvents.reduce((acc, event) => {
      const categoryName = getCategoryName(event.category as string) || "Uncategorized";
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(event);
      return acc;
    }, {} as { [key: string]: Event[] });
    
    // Now, map the events within each group to have a formatted name for the dropdown
    return Object.entries(groups).map(([category, events]) => ({
      label: category,
      options: events.map(event => ({ id: event.id, name: formatEventName(event), icon: event.icon ?? undefined }))
    }));
  }, [allEvents, allCategories, getCategoryName, formatEventName]);

  return (
    <>
      <div className="mb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-monument-green dark:text-green-400 mb-2">
          🗓️ Schedule
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View upcoming, ongoing, and finished events
        </p>
      </div>

      {/* Search and View Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <div className="relative w-full sm:max-w-xs order-2 sm:order-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Search by event, department, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg dark:bg-gray-700 self-end sm:self-center order-1 sm:order-2">
          <button onClick={() => setViewMode('card')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${viewMode === 'card' ? 'bg-white text-monument-green shadow-sm dark:bg-gray-600 dark:text-white' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600/50'}`}>
            <FaThLarge />
            Cards
          </button>
          <button onClick={() => setViewMode('table')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${viewMode === 'table' ? 'bg-white text-monument-green shadow-sm dark:bg-gray-600 dark:text-white' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600/50'}`}>
            <FaTable />
            Table
          </button>
        </div>
      </div>

      {/* ---------- FILTERS ---------- */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center justify-center text-xl leading-none">🔍</div>
            <h3 className="font-semibold text-base md:text-lg leading-none">Filters</h3>
            <button
              onClick={clearAll}
              className="ml-2 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"
            >
              Clear
            </button>
          </div>
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="text-xs md:text-sm border px-2 md:px-3 py-1 md:py-2 rounded-md hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            {isFiltersOpen ? "Hide ▲" : "Show ▼"}
          </button>
        </div>

        <AnimatePresence>
          {isFiltersOpen && (
            <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
            >
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <SingleSelectDropdown
                    options={[
                      { id: "all", name: "All Statuses" },
                      { id: "upcoming", name: "Upcoming", icon: "⏳" },
                      { id: "ongoing", name: "Ongoing", icon: "🔴" },
                      { id: "finished", name: "Finished", icon: "✅" },
                    ]}
                    selectedValue={statusFilter}
                    onChange={setStatusFilter}
                    placeholder="Select Status"
                  />
                </div>

                {/* Event */}
                <div>
                  <label className="block text-sm font-medium mb-1">Event</label>
                  <SingleSelectDropdown
                    options={[{ id: "all", name: "All Events" }, ...groupedEvents]}
                    selectedValue={eventFilter}
                    onChange={setEventFilter}
                    placeholder="Select Event"
                  />
                </div>

                {/* Venue */}
                <div>
                  <label className="block text-sm font-medium mb-1">Venue</label>
                  <SingleSelectDropdown
                    options={[
                      { id: "all", name: "All Venues" },
                      ...allVenues.map((v) => ({ id: v.id!, name: v.name })),
                    ]}
                    selectedValue={venueFilter}
                    onChange={setVenueFilter}
                    placeholder="Select Venue"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <SingleSelectDropdown
                    options={[
                      { id: "all", name: "All Departments" },
                      ...allDepartments.map((d) => ({
                        id: d.name,
                        name: d.name,
                        image_url: d.image_url,
                      })),
                    ]}
                    selectedValue={departmentFilter}
                    onChange={setDepartmentFilter}
                    placeholder="Select Department"
                  />
                </div>

                {/* Date Range */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Date Range</label>
                  <div className="flex items-center gap-2 ">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <FaCalendarAlt />
                      </div>
                      <input
                        type="date"
                        value={dateFromFilter}
                        onChange={(e) => setDateFromFilter(e.target.value)}
                        className="input pl-10"
                        aria-label="Date From"
                      />
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">to</span>
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <FaCalendarAlt />
                      </div>
                      <input
                        type="date"
                        value={dateToFilter}
                        onChange={(e) => setDateToFilter(e.target.value)}
                        className="input pl-10"
                        aria-label="Date To"
                      />
                    </div>
                  </div>
                </div>

                {/* Time Range */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Time Range</label>
                  <div className="flex items-center gap-2 ">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <FaClock />
                      </div>
                      <input type="time" value={timeFromFilter} onChange={(e) => setTimeFromFilter(e.target.value)} className="input pl-10" />
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">to</span>
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <FaClock />
                      </div>
                      <input type="time" value={timeToFilter} onChange={(e) => setTimeToFilter(e.target.value)} className="input pl-10" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-sm text-gray-500 mb-4 dark:text-gray-400 px-1">
        📊 Showing {filterCount} of {totalCount} events
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'card' ? (
          <motion.div
            key="card-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredSchedules.length > 0 ? (
              filteredSchedules.map((s) => {
                const { label, color, icon } = getDynamicStatus(s);
                return (
                  <div
                    key={s.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div
                      className={`${color} px-4 py-2 flex items-center justify-between`}
                    >
                      <span className="text-white font-semibold text-sm flex items-center gap-2">
                        <span>{icon}</span>
                        {label}
                      </span>
                      <span className="text-white text-xs opacity-90 font-bold">
                        {formatDate(s.date)}
                      </span>
                    </div>
                    <CardContent className="p-4 pt-4 space-y-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="flex items-center gap-2">
                          {s.events?.icon && (
                            <span className="text-3xl">{s.events.icon}</span>
                          )}
                          <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100">
                            {s.events?.name || "N/A"}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs">
                          {s.events?.category && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full dark:bg-blue-900/50 dark:text-blue-300">
                              {/* If category is an object it has a name, otherwise it's a UUID we need to look up */}
                              {typeof s.events.category === 'object' ? s.events.category.name : getCategoryName(s.events.category)}
                            </span>
                          )}
                          {s.events?.division && s.events.division !== 'N/A' && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full dark:bg-purple-900/50 dark:text-purple-300">
                              {s.events.division}
                            </span>
                          )}
                          {s.events?.gender && s.events.gender !== 'N/A' && (
                            <span className="bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full dark:bg-pink-900/50 dark:text-pink-300">
                              {s.events.gender}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="border-t border-gray-100 dark:border-gray-700 pt-4"></div>
                      <div>
                        <div className="flex items-start justify-center gap-4 flex-wrap">
                          {s.departments.map((d, i) => (
                            <Fragment key={typeof d === "string" ? d : d.id}>
                              <div className="flex flex-col items-center gap-2">
                                {typeof d === "object" && d.image_url ? (
                                  <Image
                                    src={d.image_url}
                                    alt={d.name}
                                    width={64}
                                    height={64}
                                    className="rounded-full w-16 h-16 object-cover border-4 border-gray-200 dark:border-gray-600"
                                  />
                                ) : (
                                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-monument-green/20 dark:bg-green-900/30 text-xl font-bold text-monument-green dark:text-green-400">
                                    {typeof d === "object"
                                      ? d.abbreviation || d.name.slice(0, 3)
                                      : d.slice(0, 3)}
                                  </div>
                                )}
                                <span className="text-sm font-semibold">
                                  {typeof d === "object" ? d.abbreviation || d.name : d}
                                </span>
                              </div>
                              {i < s.departments.length - 1 && (
                                <span className="text-monument-green dark:text-green-500 text-xl font-black self-center italic">
                                  vs
                                </span>
                              )}
                            </Fragment>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                            <FaClock />
                            <span>Time</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
                            {formatTime(s.start_time)} - {formatTime(s.end_time)}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                            <FaMapMarkerAlt />
                            <span>Venue</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
                            {s.venues?.name || "TBA"}
                          </p>
                        </div>  
                      </div>
                    </CardContent>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-6xl mb-4">🗓️</div>
                <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200">{searchQuery ? "No Schedules Match Your Search" : "No Schedules Match Filters"}</h3>
                <p className="text-gray-500 dark:text-gray-400">{searchQuery ? "Try a different search term." : "Try adjusting your filter criteria."}</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="table-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="table-container"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800 dark:text-gray-300 rounded-lg shadow-md overflow-hidden">
                <thead className="bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Venue</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Departments</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSchedules.length > 0 ? (
                    filteredSchedules.map((s) => {
                      const { label } = getDynamicStatus(s);
                      return (
                        <tr key={s.id} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{s.events?.icon || '🏅'}</span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">{s.events?.name || 'N/A'}</span>
                              <div className="flex flex-wrap items-center gap-1 text-xs ml-2">
                                {s.events?.category && (
                                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full dark:bg-blue-900/50 dark:text-blue-300">
                                    {typeof s.events.category === 'object' ? s.events.category.name : getCategoryName(s.events.category)}
                                  </span>
                                )}
                                {s.events?.division && s.events.division !== 'N/A' && (
                                  <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full dark:bg-purple-900/50 dark:text-purple-300">
                                    {s.events.division}
                                  </span>
                                )}
                                {s.events?.gender && s.events.gender !== 'N/A' && (
                                  <span className="bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full dark:bg-pink-900/50 dark:text-pink-300">
                                    {s.events.gender}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-bold">{formatDate(s.date)}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-start">
                              <span>{formatTime(s.start_time)}</span>
                              <span>{formatTime(s.end_time)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{s.venues?.name || 'TBA'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-4">
                              {s.departments.map((d, i) => (
                                <Fragment key={typeof d === "string" ? d : d.id}>
                                  <div className="flex flex-col items-center gap-1 text-center">
                                    {typeof d === "object" && d.image_url ? (
                                      <Image src={d.image_url} alt={d.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600" />
                                    ) : (
                                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600 text-sm font-bold text-gray-500 dark:text-gray-300">
                                        {typeof d === "object" ? d.abbreviation || d.name.slice(0, 2) : d.slice(0, 2)}
                                      </div>
                                    )}
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                      {typeof d === 'object' ? d.abbreviation || d.name : d}
                                    </span>
                                  </div>
                                  {i < s.departments.length - 1 && (
                                    <span className="text-monument-green dark:text-green-500 text-lg font-black self-center italic">
                                      vs
                                    </span>
                                  )}
                                </Fragment>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                s.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                                s.status === 'ongoing' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                                'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                              }`}>
                              {label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center">
                          <div className="text-4xl mb-2">🗓️</div>
                          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">{searchQuery ? "No Schedules Match Your Search" : "No Schedules Match Filters"}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{searchQuery ? "Try a different search term." : "Try adjusting your filter criteria."}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

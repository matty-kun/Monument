import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { ProcessedResult, GroupedResult } from "../models/resultsTypes";

interface UseResultsViewModelProps {
  initialResults: ProcessedResult[];
  initialCategories: { id: string; name: string; icon?: string }[];
  initialMysteryMode?: boolean;
}

export const useResultsViewModel = ({
  initialResults,
  initialCategories,
  initialMysteryMode = false,
}: UseResultsViewModelProps) => {
  const [mysteryMode, setMysteryMode] = useState(initialMysteryMode);
  const [results] = useState<ProcessedResult[]>(initialResults);
  const [filteredResults, setFilteredResults] = useState<ProcessedResult[]>(initialResults);
  const [allDepartments, setAllDepartments] = useState<{ name: string; image_url: string | null; abbreviation?: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRefresh, setShowRefresh] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('public-events-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'results' },
        () => setShowRefresh(true)
      )
      .subscribe();

    const mysterySub = supabase
      .channel('app_settings_events')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings', filter: "key=eq.mystery_mode" },
        (payload) => {
          if (payload.new && (payload.new as any).key === 'mystery_mode') {
            setMysteryMode((payload.new as any).value === 'true');
          } else if (payload.eventType === 'DELETE') {
            setMysteryMode(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(mysterySub);
    };
  }, [supabase]);

  const getCategoryName = useCallback((categoryId: string | null) => {
    if (!categoryId) return null;
    return initialCategories.find(c => c.id === categoryId)?.name || categoryId;
  }, [initialCategories]);

  useEffect(() => {
    let processed = [...results];

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      processed = processed.filter(r =>
        r.event_name.toLowerCase().includes(lowercasedQuery) ||
        (r.department_name || '').toLowerCase().includes(lowercasedQuery) ||
        (r.department_abbreviation || '').toLowerCase().includes(lowercasedQuery) ||
        (getCategoryName(r.category) || '').toLowerCase().includes(lowercasedQuery)
      );
    }

    if (allDepartments.length === 0 && processed.length > 0) {
      const departmentMap = new Map<string, { name: string; image_url: string | null; abbreviation: string }>();
      results.forEach(r => {
        if (r.department_name && !departmentMap.has(r.department_name)) {
          departmentMap.set(r.department_name, {
            name: r.department_name,
            image_url: r.department_image_url || null,
            abbreviation: r.department_abbreviation || "",
          });
        }
      });
      setAllDepartments(Array.from(departmentMap.values()));
    }

    setFilteredResults(processed);
  }, [results, searchQuery, allDepartments.length, getCategoryName]);

  const grouped = useMemo(() => {
    return filteredResults.reduce((acc, result) => {
      const eventCategoryName = getCategoryName(result.category);
      if (!acc[result.event_name]) {
        acc[result.event_name] = {
          icon: result.event_icon,
          category: eventCategoryName,
          division: result.division,
          gender: result.gender,
          winners: {},
        };
      }
      if (result.medal_type) {
        acc[result.event_name].winners[result.medal_type] = {
          department_id: result.department_id,
          department_name: result.department_name,
          department_abbreviation: result.department_abbreviation,
          image_url: result.department_image_url,
        };
      }
      return acc;
    }, {} as Record<string, GroupedResult>);
  }, [filteredResults, getCategoryName]);

  const refreshPage = () => {
    window.location.reload();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(w => !['of', 'and', 'the'].includes(w.toLowerCase()))
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 3);
  };

  return {
    mysteryMode,
    searchQuery,
    setSearchQuery,
    showRefresh,
    refreshPage,
    grouped,
    getInitials,
  };
};

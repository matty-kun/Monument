import { createReadOnlyClient } from "@/utils/supabase/server";
import EventsClientPage from "./EventsClientPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Event Results | MONUMENT",
  description:
    "Check the latest results, medal standings, and winners for all SIDLAK intramural events. Filter by category, medal, and department.",
  openGraph: {
    title: "Event Results | MONUMENT",
    description: "Latest results and medal standings for SIDLAK intramurals.",
  },
};

export const dynamic = "force-dynamic";

// Types
interface Result {
  id: string;
  created_at: string;
  department_id: string;
  medal_type: "gold" | "silver" | "bronze";
  events: {
    name: string;
    category: string | null;
    division: string | null;
    gender: string | null;
    icon: string | null;
  } | null;
  tournament_departments: {
    name: string;
    abbreviation: string;
    image_url: string | null;
  } | null;
}

interface ProcessedResult {
  event_name: string;
  category: string | null;
  division: string | null;
  gender: string | null;
  event_icon: string | null;
  department_id: string | null;
  department_name: string | null;
  department_abbreviation: string | null;
  department_image_url?: string;
  medal_type: "gold" | "silver" | "bronze";
  created_at: string;
}

const getCategoryIcon = (categoryName: string | null): string => {
  if (!categoryName) return "🏅";
  const lowerCaseName = categoryName.toLowerCase();
  if (lowerCaseName.includes("ball")) return "🏀";
  if (lowerCaseName.includes("board")) return "♟️";
  if (lowerCaseName.includes("track") || lowerCaseName.includes("field"))
    return "🏃";
  if (lowerCaseName.includes("vocal")) return "🎤";
  if (lowerCaseName.includes("dance")) return "💃";
  if (lowerCaseName.includes("esports")) return "🎮";
  if (lowerCaseName.includes("literary")) return "✍️";
  return "🏆"; // Default icon
};

export default async function EventResultsPage({ searchParams }: { searchParams: Promise<{ tournament?: string }> }) {
  const supabase = await createReadOnlyClient();
  const resolvedParams = await searchParams;
  const tSlug = resolvedParams?.tournament;

  let tournamentId: string | undefined;
  let mysteryMode = false;

  if (tSlug) {
    const { data: tData } = await supabase.from('tournaments').select('id, mystery_mode').eq('slug', tSlug).single();
    if (tData) {
      tournamentId = tData.id;
      mysteryMode = tData.mystery_mode;
    }
  } else {
    const { data: activeT } = await supabase.from('tournaments').select('id, mystery_mode').eq('is_active', true).single();
    if (activeT) {
      tournamentId = activeT.id;
      mysteryMode = activeT.mystery_mode;
    }
  }

  const fetchEventData = async (): Promise<{
    results: ProcessedResult[];
    categories: { id: string; name: string; icon?: string }[];
  }> => {
    let query = supabase
      .from("results")
      .select(`
        id,
        created_at,
        department_id,
        medal_type,
        events!inner ( name, category, icon, division, gender, tournament_id )
      `);
      
    if (tournamentId) {
       query = query.eq('tournament_id', tournamentId);
    }
    
    // Also fetch tournament departments
    const { data: deptData } = await supabase
      .from("tournament_departments")
      .select("department_id, name, abbreviation, image_url")
      .eq("tournament_id", tournamentId || '');

    const { data: resultsData, error: resultsError } = await query.order('created_at', { ascending: false });

    if (resultsError) {
      console.error("Error fetching event results:", resultsError);
      const fs = require('fs');
      fs.writeFileSync('error_log.txt', JSON.stringify(resultsError, null, 2));
      return { results: [], categories: [] };
    }

    const fs = require('fs');
    fs.writeFileSync('data_log.txt', JSON.stringify({
       tSlug: tournamentId,
       count: resultsData ? resultsData.length : 0
    }, null, 2));

    const typedResults = resultsData as unknown as Result[];
    const processedResults: ProcessedResult[] = typedResults.map((r) => {
      const dept = deptData?.find(d => d.department_id === r.department_id);
      return {
        event_name: r.events?.name || "Unknown Event",
        category: r.events?.category || null,
        division: r.events?.division || null,
        gender: r.events?.gender || null,
        event_icon: r.events?.icon || null,
        department_id: r.department_id || null,
        department_name: dept?.name || null,
        department_abbreviation: dept?.abbreviation || null,
        department_image_url: dept?.image_url || undefined,
        medal_type: r.medal_type,
        created_at: r.created_at,
      };
    });

    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name");

    const processedCategories =
      categoriesData?.map((c: { id: string; name: string }) => ({
        ...c,
        icon: getCategoryIcon(c.name),
      })) || [];

    return { results: processedResults, categories: processedCategories };
  };

  if (!tournamentId) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 animate-fadeIn">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-monument-primary blur-[100px] opacity-20 rounded-full"></div>
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-500 dark:from-white dark:to-gray-500 tracking-[0.1em] uppercase relative z-10">
            MONUMENT
          </h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-sm md:text-base max-w-lg leading-relaxed">
          The season has concluded. <br/>
          Check back later for upcoming intramurals, or explore the archives above.
        </p>
      </div>
    );
  }

  const { results, categories } = await fetchEventData();

  return (
    <EventsClientPage
      initialResults={results}
      initialCategories={categories}
      mysteryMode={mysteryMode}
    />
  );
}

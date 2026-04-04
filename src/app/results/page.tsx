import { createClient } from "@/utils/supabase/server";
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
  department_id: string;
  medal_type: "gold" | "silver" | "bronze";
  events: {
    name: string;
    category: string | null;
    division: string | null;
    gender: string | null;
    icon: string | null;
  } | null;
  departments: {
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

export default async function EventResultsPage() {
  const supabase = await createClient();

  const fetchEventData = async (): Promise<{
    results: ProcessedResult[];
    categories: { id: string; name: string; icon?: string }[];
  }> => {
    // FIXED: Fetch only medal results, removing match winners from the Events Hall of Fame
    const { data: resultsData, error: resultsError } = await supabase
      .from("results")
      .select(`
        id,
        department_id,
        medal_type,
        events ( name, category, icon, division, gender ),
        departments ( name, abbreviation, image_url )
      `);

    if (resultsError) {
      console.error("Error fetching event results:", resultsError);
      return { results: [], categories: [] };
    }

    const typedResults = resultsData as unknown as Result[];
    const processedResults: ProcessedResult[] = typedResults.map((r) => ({
      event_name: r.events?.name || "Unknown Event",
      category: r.events?.category || null,
      division: r.events?.division || null,
      gender: r.events?.gender || null,
      event_icon: r.events?.icon || null,
      department_id: r.department_id || null,
      department_name: r.departments?.name || null,
      department_abbreviation: r.departments?.abbreviation || null,
      department_image_url: r.departments?.image_url || undefined,
      medal_type: r.medal_type,
    }));

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

  const { results, categories } = await fetchEventData();

  return (
    <EventsClientPage
      initialResults={results}
      initialCategories={categories}
    />
  );
}

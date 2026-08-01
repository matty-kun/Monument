const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://mbfyjithiqpotfztfzzp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iZnlqaXRoaXFwb3RmenRmenpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MjU3NTksImV4cCI6MjA5MDQwMTc1OX0.2WbXJq_cJWPbHxE-SBWqUqewIv3NuqHxe-hsgb1rkVY');

async function main() {
  const tournamentId = '200b4cda-3387-4913-99a1-386642e8df52';
  let query = supabase
    .from("results")
    .select(`
      id,
      created_at,
      department_id,
      medal_type,
      events!inner ( name, category, icon, division, gender, tournament_id )
    `)
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) console.error("Error:", error);
  else console.log("Results count with ANON key:", data.length);
}
main();

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://mbfyjithiqpotfztfzzp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iZnlqaXRoaXFwb3RmenRmenpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgyNTc1OSwiZXhwIjoyMDkwNDAxNzU5fQ.HcTqUDKpGsM7CyO9NO_i9JDfpJvvEQeQ3y5NvwOnFEE');

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
  
  if (data && data.length > 0) {
     console.log("Single row:", JSON.stringify(data[0], null, 2));
  }
}
main();

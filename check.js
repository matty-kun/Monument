const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://mbfyjithiqpotfztfzzp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iZnlqaXRoaXFwb3RmenRmenpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgyNTc1OSwiZXhwIjoyMDkwNDAxNzU5fQ.HcTqUDKpGsM7CyO9NO_i9JDfpJvvEQeQ3y5NvwOnFEE');

async function main() {
  const { data: tournaments, error: tError } = await supabase.from('tournaments').select('*');
  console.log('Tournaments:', tournaments);

  const { data: results, error: rError } = await supabase.from('results').select('*');
  console.log('Results Count:', results ? results.length : 0);
  if (results && results.length > 0) {
      console.log('Sample result:', results[0]);
  } else if (rError) {
      console.error(rError);
  }
}
main();

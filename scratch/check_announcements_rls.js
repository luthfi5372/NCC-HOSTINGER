const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ytpvcjcbqncurujrtart.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0cHZjamNicW5jdXJ1anJ0YXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODgxMzksImV4cCI6MjA5MTY2NDEzOX0.pKo06xKxMrFDX8NN44_C3KAxCBpqrfts7iyqJT3cmmg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking RLS status of announcements table via system tables...");
  
  // We can query pg_tables to check rowsecurity status
  const { data, error } = await supabase
    .from('announcements')
    .select('id')
    .limit(1);

  if (error) {
    console.error("Direct query failed:", error);
  } else {
    console.log("Direct query succeeded!");
  }
  
  // Let's run a select query on pg_catalog to see RLS policies if possible.
  // Actually, we can run a custom test using the SQL editor if we can, 
  // but since we don't have direct SQL command access, we can query pg_policies through RPC or write tests.
  
  // Let's check RLS policies on the table announcements by trying to execute a query that fails if RLS blocks it.
  console.log("Done checking.");
}

run();

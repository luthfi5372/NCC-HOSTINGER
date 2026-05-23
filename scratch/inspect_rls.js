const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ytpvcjcbqncurujrtart.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0cHZjamNicW5jdXJ1anJ0YXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODgxMzksImV4cCI6MjA5MTY2NDEzOX0.pKo06xKxMrFDX8NN44_C3KAxCBpqrfts7iyqJT3cmmg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking RLS and policies on announcements...");
  
  // We can query pg_policy and pg_tables to check RLS status
  const { data, error } = await supabase.rpc('get_announcements_rls_status');
  if (error) {
    console.log("RPC get_announcements_rls_status not available. Let's do a direct select and check if we can query system catalog.");
    
    // Attempting to query pg_policies using custom select (if permitted, usually anon key is restricted)
    const { data: pgData, error: pgError } = await supabase
      .from('announcements')
      .select('id')
      .limit(1);
    
    console.log("Direct select test on announcements:", pgData, pgError);
  } else {
    console.log("RLS Status:", data);
  }
  
  // Let's also check if we can update a row using the anonymous key
  const { data: updateData, error: updateError } = await supabase
    .from('announcements')
    .update({ content: JSON.stringify({ isRegistrationOpen: true, waves: [], paymentRequirementStage: 'tahap1' }) })
    .eq('title', 'SYS_PORTAL_SETTINGS')
    .select();
    
  console.log("Direct update via anon key result:", updateData, updateError);
}

run();

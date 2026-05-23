const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ytpvcjcbqncurujrtart.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0cHZjamNicW5jdXJ1anJ0YXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODgxMzksImV4cCI6MjA5MTY2NDEzOX0.pKo06xKxMrFDX8NN44_C3KAxCBpqrfts7iyqJT3cmmg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Querying triggers and rules on announcements...");
  
  // We can query pg_trigger or pg_rules via an RPC if there's any, 
  // or we can execute a dynamic check by calling a non-existent function to trigger an error
  // which lists details, or we can try inserting something directly from node to see if we get the exact same error.
  
  console.log("Attempting direct insert of SYS_PORTAL_SETTINGS...");
  const { data, error } = await supabase
    .from('announcements')
    .insert([{
      title: 'SYS_PORTAL_SETTINGS',
      content: JSON.stringify({ isRegistrationOpen: true, waves: [], paymentRequirementStage: 'registration' }),
      target_audience: 'All'
    }]);

  console.log("Insert result:", data, error);
}

run();

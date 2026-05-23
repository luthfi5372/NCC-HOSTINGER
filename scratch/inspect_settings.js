const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ytpvcjcbqncurujrtart.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0cHZjamNicW5jdXJ1anJ0YXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODgxMzksImV4cCI6MjA5MTY2NDEzOX0.pKo06xKxMrFDX8NN44_C3KAxCBpqrfts7iyqJT3cmmg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Querying cbt_settings...");
  const { data: cbtData, error: cbtError } = await supabase
    .from('cbt_settings')
    .select('*');
  console.log("cbt_settings:", cbtData, cbtError);

  console.log("Querying site_settings...");
  const { data: siteData, error: siteError } = await supabase
    .from('site_settings')
    .select('*');
  console.log("site_settings:", siteData, siteError);
}

test();

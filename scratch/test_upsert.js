const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ytpvcjcbqncurujrtart.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0cHZjamNicW5jdXJ1anJ0YXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODgxMzksImV4cCI6MjA5MTY2NDEzOX0.pKo06xKxMrFDX8NN44_C3KAxCBpqrfts7iyqJT3cmmg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Attempting upsert on cbt_settings...");
  const { data: cbtData, error: cbtError } = await supabase
    .from('cbt_settings')
    .upsert({
      id: 1,
      strict_mode: true,
      auto_save: true,
      maintenance_mode: true,
      updated_at: new Date().toISOString()
    });
  console.log("cbt_settings upsert result:", cbtData, cbtError);

  console.log("Attempting upsert on site_settings...");
  const { data: siteData, error: siteError } = await supabase
    .from('site_settings')
    .upsert({
      id: 1,
      result_visible: false,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  console.log("site_settings upsert result:", siteData, siteError);
}

test();

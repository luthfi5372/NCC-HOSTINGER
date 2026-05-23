const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ytpvcjcbqncurujrtart.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0cHZjamNicW5jdXJ1anJ0YXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODgxMzksImV4cCI6MjA5MTY2NDEzOX0.pKo06xKxMrFDX8NN44_C3KAxCBpqrfts7iyqJT3cmmg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Testing partial upsert on site_settings...");
  const { data, error } = await supabase
    .from('site_settings')
    .upsert({
      id: 1,
      result_visible: false
    }, { onConflict: 'id' })
    .select();

  console.log("Upsert result:", data, error);
}

run();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) {
    envVars[parts[0].trim()] = parts[1].trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectTimeline() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('title', 'SYSTEM_TIMELINE_CONFIG')
    .single();

  if (error) {
    console.error("Error fetching timeline config:", error);
    return;
  }

  console.log("SYSTEM_TIMELINE_CONFIG ROW:");
  console.log("ID:", data.id);
  console.log("Title:", data.title);
  
  if (data.content) {
    try {
      const parsed = JSON.parse(data.content);
      const mtq = parsed.find(cat => cat.category.toLowerCase().includes('mtq'));
      console.log("\nMTQ TIMELINE IN DATABASE:");
      console.log(JSON.stringify(mtq, null, 2));
    } catch (e) {
      console.error("Failed to parse JSON content:", e);
    }
  }
}

inspectTimeline();

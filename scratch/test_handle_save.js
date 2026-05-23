const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ytpvcjcbqncurujrtart.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0cHZjamNicW5jdXJ1anJ0YXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODgxMzksImV4cCI6MjA5MTY2NDEzOX0.pKo06xKxMrFDX8NN44_C3KAxCBpqrfts7iyqJT3cmmg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Simulating handleSave...");

  // 1. Save CBT Settings
  console.log("Saving cbt_settings...");
  const { data: cbtData, error: cbtError } = await supabase.from('cbt_settings').upsert({
    id: 1,
    strict_mode: true,
    auto_save: true,
    maintenance_mode: false,
    updated_at: new Date().toISOString()
  }).select();
  console.log("cbt_settings error:", cbtError);

  // 2. Save Site Settings
  console.log("Saving site_settings...");
  const { data: siteData, error: siteError } = await supabase.from('site_settings').upsert({
    id: 1,
    result_visible: false
  }, { onConflict: 'id' }).select();
  console.log("site_settings error:", siteError);

  // 3. Save Portal Settings
  console.log("Saving portal settings (announcements)...");
  // Fetch existing portal settings first
  const { data: portalData, error: fetchError } = await supabase.from('announcements').select('*').eq('title', 'SYS_PORTAL_SETTINGS').single();
  console.log("Fetch existing portal settings error:", fetchError);
  
  if (portalData) {
    try {
      const parsed = JSON.parse(portalData.content);
      parsed.waves = [];
      parsed.isRegistrationOpen = true;
      parsed.paymentRequirementStage = 'registration'; // Let's set it to registration to simulate saving Awal Pendaftaran
      
      const newContent = JSON.stringify(parsed);
      const { data: updatedData, error: pErr } = await supabase
        .from('announcements')
        .update({ content: newContent })
        .eq('title', 'SYS_PORTAL_SETTINGS')
        .select();
        
      console.log("announcements update error:", pErr);
      console.log("announcements updated content:", updatedData ? updatedData[0].content : null);
    } catch (e) {
      console.error("Exception during parsing/saving portal settings:", e);
    }
  }
}

run();

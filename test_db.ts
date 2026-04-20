import { createClient } from './src/lib/supabase/client';

async function test() {
  const supabase = createClient();
  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single();
  if (error) {
    console.error('Error fetching settings:', error);
  } else {
    console.log('Current Settings:', data);
  }
}

test();

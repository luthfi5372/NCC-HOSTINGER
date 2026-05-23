const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ytpvcjcbqncurujrtart.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0cHZjamNicW5jdXJ1anJ0YXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODgxMzksImV4cCI6MjA5MTY2NDEzOX0.pKo06xKxMrFDX8NN44_C3KAxCBpqrfts7iyqJT3cmmg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testColumn(colName) {
  const { data, error } = await supabase
    .from('competition_schedules')
    .select(colName)
    .limit(1);

  if (error) {
    console.log(`Column '${colName}': DOES NOT EXIST (Error: ${error.message})`);
  } else {
    console.log(`Column '${colName}': EXISTS`);
  }
}

async function run() {
  const columnsToTest = [
    'id', 'title', 'start_date', 'end_date', 'cbt_exam_id', 'exam_id', 
    'exam', 'created_at', 'category', 'competition_id', 'lomba_id'
  ];
  for (const col of columnsToTest) {
    await testColumn(col);
  }
}

run();

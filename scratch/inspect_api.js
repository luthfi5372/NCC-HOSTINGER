async function test() {
  try {
    const response = await fetch('https://ytpvcjcbqncurujrtart.supabase.co/rest/v1/', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0cHZjamNicW5jdXJ1anJ0YXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODgxMzksImV4cCI6MjA5MTY2NDEzOX0.pKo06xKxMrFDX8NN44_C3KAxCBpqrfts7iyqJT3cmmg'
      }
    });
    const text = await response.text();
    console.log("Response text status:", response.status);
    console.log("Response text (first 500 chars):", text.substring(0, 500));
  } catch (err) {
    console.error("Error:", err);
  }
}

test();

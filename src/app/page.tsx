// DIAGNOSTIC TEST: Minimal page with zero imports
// If this works → routing is fine, problem is in component imports
// If this fails → problem is at routing/config level

export default function Home() {
  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      background: "#0f0f23",
      color: "white",
      fontFamily: "sans-serif",
      textAlign: "center"
    }}>
      <div>
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏆 NCC 2026</h1>
        <p style={{ fontSize: "1.2rem", opacity: 0.7 }}>Server is working! Full site loading...</p>
        <p style={{ fontSize: "0.9rem", marginTop: "1rem", opacity: 0.5 }}>Diagnostic commit - verifying routing</p>
      </div>
    </div>
  );
}

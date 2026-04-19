"use client";

export default function AdminDashboard() {
  return (
    <div style={{ 
      backgroundColor: 'black', 
      color: 'white', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ color: '#4ade80', marginBottom: '1rem' }}>✅ SAFE MODE: Ruang Admin Berhasil Diakses!</h1>
      <p style={{ color: '#94a3b8' }}>Jika Anda melihat layar ini, berarti Middleware & Routing sudah SEMPURNA.</p>
      <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '2rem' }}>NCC Production Environment - Diagnostic Mode</p>
    </div>
  );
}

import { NextResponse } from 'next/server';
import { getPool } from '@/lib/mysql-db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pool = getPool();
    
    // 1. Ambil semua admin dari tabel profiles
    const [rows]: any = await pool.execute(
      'SELECT id, username, email, password_hash, full_name, role FROM profiles WHERE role = ? OR email LIKE ?',
      ['admin', '%admin%']
    );

    const results: any[] = [];

    // 2. Hash default yang benar untuk admin
    // admin1@ncc.id -> password: "123456"
    // admin@ncc.id -> password: "admin123"
    const correctHash123456 = bcrypt.hashSync('123456', 10);
    const correctHashAdmin123 = bcrypt.hashSync('admin123', 10);

    for (const user of rows) {
      let status = 'No action';
      let needsUpdate = false;
      let targetHash = '';

      if (user.email === 'admin1@ncc.id') {
        const isMatch = bcrypt.compareSync('123456', user.password_hash);
        if (!isMatch) {
          needsUpdate = true;
          targetHash = correctHash123456;
          status = 'Password hash corrupted/incorrect. Needs auto-healing.';
        } else {
          status = 'Password is correct (123456).';
        }
      } else if (user.email === 'admin@ncc.id') {
        const isMatch = bcrypt.compareSync('admin123', user.password_hash);
        if (!isMatch) {
          needsUpdate = true;
          targetHash = correctHashAdmin123;
          status = 'Password hash corrupted/incorrect. Needs auto-healing.';
        } else {
          status = 'Password is correct (admin123).';
        }
      }

      if (needsUpdate && targetHash) {
        await pool.execute(
          'UPDATE profiles SET password_hash = ? WHERE id = ?',
          [targetHash, user.id]
        );
        status = 'Password hash successfully updated and healed!';
      }

      results.push({
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        current_hash_snippet: user.password_hash ? `${user.password_hash.substring(0, 15)}... (length: ${user.password_hash.length})` : 'NULL',
        status
      });
    }

    // 3. Jika tidak ada admin sama sekali di database, buat akun admin default
    if (rows.length === 0) {
      const admin1Id = 'admin1-uuid-0000-0000-000000000000';
      await pool.execute(
        `INSERT INTO profiles (id, username, email, password_hash, full_name, role) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [admin1Id, 'admin1', 'admin1@ncc.id', correctHash123456, 'Admin Command Center', 'admin']
      );

      results.push({
        email: 'admin1@ncc.id',
        role: 'admin',
        status: 'Admin did not exist. Created a new admin1 account on the fly with password 123456!'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Setup and diagnostics complete.',
      admins: results
    });
  } catch (err: any) {
    console.error('[Setup Admin API Error]:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Unknown error occurred during setup.'
    }, { status: 500 });
  }
}

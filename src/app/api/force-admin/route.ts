import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  // Kita pakai Anon Key biasa untuk memicu pembuatan user
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // Taktik 1: Paksa mendaftar (Sign Up)
    // Jika email confirm aktif di Supabase, ini akan butuh verifikasi email.
    // Namun jika sudah dimatikan, akun akan langsung aktif.
    const { data, error } = await supabase.auth.signUp({
      email: 'admin1@ncc.id',
      password: '123456',
      options: {
        data: {
          role: 'admin',
          full_name: 'Super Admin NCC'
        }
      }
    });

    if (error) {
      return NextResponse.json({ 
        status: "GAGAL", 
        alasan: error.message,
        tip: "Jika error 'User already registered', berarti akun sudah aman di database."
      }, { status: 400 });
    }

    return NextResponse.json({ 
      status: "SUKSES BUAT AKUN", 
      pesan: "Akun admin1@ncc.id telah didaftarkan. Silakan coba login di Vercel.",
      data: {
        id: data.user?.id,
        email: data.user?.email
      }
    });
  } catch (err: any) {
    return NextResponse.json({ status: "ERROR FATAL", alasan: err.message }, { status: 500 });
  }
}

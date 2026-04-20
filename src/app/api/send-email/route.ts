import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email_peserta, nama_peserta, kategori_lomba, id_pendaftaran } = body;

    const { data, error } = await resend.emails.send({
      // WAJIB gunakan onboarding@resend.dev selama masa uji coba (Sandbox)
      from: 'NCC 13th <onboarding@resend.dev>', 
      to: email_peserta, // Nanti saat test, pastikan email peserta ini = email akun Resend Anda
      subject: `✅ Pembayaran Diterima - ${kategori_lomba} NCC 13th`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(to right, #2563eb, #4f46e5); padding: 24px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">National Creativity Competition</h1>
          </div>
          <div style="padding: 24px; background-color: #f8fafc; color: #334155;">
            <p>Halo <strong>${nama_peserta}</strong>,</p>
            <p>Selamat! Pembayaran Anda untuk kategori <strong>${kategori_lomba}</strong> telah berhasil kami verifikasi.</p>
            
            <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">ID Pendaftaran / Nomor Peserta:</p>
              <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: bold; letter-spacing: 1px;">NCC-${String(id_pendaftaran).substring(0, 6).toUpperCase()}</p>
            </div>

            <p>Silakan masuk ke Dashboard Anda untuk mengunduh Twibbon resmi dan bergabung ke dalam Grup WhatsApp peserta.</p>
            
            <div style="text-align: center; margin-top: 32px;">
              <a href="https://national-creativity-competition.vercel.app/dashboard" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Buka Dashboard Peserta</a>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend Error:", error);
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Email API Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

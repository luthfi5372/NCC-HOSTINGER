import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_fallback');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, fullName, id, category, actionType } = body; // actionType: 'register' | 'payment_verified'

    if (!email || !fullName || !id || !actionType) {
      return NextResponse.json({ error: 'Missing required payload parameters' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn(`API WARNING: RESEND_API_KEY missing. Simulating [${actionType}] email for:`, email);
      return NextResponse.json({ success: true, simulated: true, note: "API Key required for actual delivery" });
    }

    const isRegistration = actionType === 'register';
    const emailSubject = isRegistration 
      ? `Berhasil Mendaftar NCC 2026 - ${category}` 
      : `Resi Pendaftaran Resmi NCC - Status: LUNAS`;

    const statusBadge = isRegistration
      ? `<td style="padding: 10px 0; font-weight: 900; text-align: right; color: #f59e0b; border-top: 1px solid #e2e8f0;">BELUM BAYAR</td>`
      : `<td style="padding: 10px 0; font-weight: 900; text-align: right; color: #10b981; border-top: 1px solid #e2e8f0;">VERIFIED / LUNAS</td>`;

    const mainMessage = isRegistration
      ? `Terima kasih telah mendaftar di <strong>National Creativity Competition 13th</strong> untuk delegasi <strong>${category}</strong>. Langkah selanjutnya adalah menyelesaikan pembayaran melalui Dashboard Peserta Anda.`
      : `Bukti pembayaran Anda telah berhasil diverifikasi oleh Panitia Verifikator Pusat. Pendaftaran Anda kini berstatus <strong>100% Aktif</strong>.`;

    const noteMessage = isRegistration
      ? `Segera amankan slot kompetisi Anda dengan melakukan pelunasan sebelum batas waktu pendaftaran ditutup.`
      : `Mohon simpan ID Identitas di atas sebagai kunci absolut untuk mengakses Technical Meeting dan portal ujian Anda bulan depan.`;

    const { data, error } = await resend.emails.send({
      from: 'NCC Registration <onboarding@resend.dev>', // To be replaced with a secured @ncc.id domain later
      to: email,
      subject: emailSubject,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 40px 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 26px; letter-spacing: 2px;">NCC 2026</h1>
            <p style="color: #c7d2fe; margin-top: 10px; font-weight: 500; letter-spacing: 1px; font-size: 14px;">${isRegistration ? 'PENDAFTARAN BERHASIL' : 'TANDA TERIMA PEMBAYARAN RESMI'}</p>
          </div>
          <div style="padding: 40px; background-color: #ffffff;">
            <p style="color: #334155; font-size: 16px; margin-top: 0;">Halo <strong style="color: #0f172a;">${fullName}</strong>,</p>
            <p style="color: #475569; line-height: 1.8;">${mainMessage}</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px; margin: 32px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Identity Check</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right; font-family: monospace; font-size: 15px; color: #0f172a;">NCC-${String(id).slice(0, 10).toUpperCase()}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; border-top: 1px solid #e2e8f0;">Delegasi Lomba</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right; color: #0f172a; border-top: 1px solid #e2e8f0;">${category}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; border-top: 1px solid #e2e8f0;">Status Keuangan</td>
                  ${statusBadge}
                </tr>
              </table>
            </div>

            <p style="color: #475569; line-height: 1.8;">${noteMessage}</p>
            
            <p style="color: #475569; margin-top: 40px; line-height: 1.6;">Salam eksekusi,<br><strong style="color: #0f172a;">Panitia Sentral NCC</strong></p>
          </div>
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
             <p style="color: #94a3b8; font-size: 11px; margin: 0; font-weight: 500;">Mail dispatcher berjalan di bawah perlindungan end-to-end encryption. Pesan dirakit oleh sistem automasi Vercel Edge.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend delivery failure:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('Trigger Engine Crash:', error);
    return NextResponse.json({ error: error.message || 'Server Fault' }, { status: 500 });
  }
}

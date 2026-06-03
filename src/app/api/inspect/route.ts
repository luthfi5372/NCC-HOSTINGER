import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    env: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "missing",
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceRoleKeySnippet: process.env.SUPABASE_SERVICE_ROLE_KEY 
        ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10)}... (len: ${process.env.SUPABASE_SERVICE_ROLE_KEY.length})` 
        : "missing"
    },
    stages: {}
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // --- DIAGNOSTIC 1: Service Role Client ---
  if (serviceRoleKey) {
    try {
      const serviceClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      const { data, error } = await serviceClient
        .from('competition_entries')
        .select('id, email, full_name, payment_status')
        .neq('email', 'admin1@ncc.id')
        .limit(5);

      diagnostics.stages.serviceRole = {
        success: !error,
        count: data?.length || 0,
        error: error ? { message: error.message, details: error.details, code: error.code } : null,
        sample: data || []
      };
    } catch (err: any) {
      diagnostics.stages.serviceRole = {
        success: false,
        error: { exception: err.message || err }
      };
    }
  } else {
    diagnostics.stages.serviceRole = {
      success: false,
      error: "Service Role Key is not defined in environment variables"
    };
  }

  // --- DIAGNOSTIC 2: Admin Login + Query ---
  try {
    const authClient = createSupabaseClient(supabaseUrl, anonKey);
    const signInResult = await authClient.auth.signInWithPassword({
      email: 'admin1@ncc.id',
      password: '123456',
    });

    if (signInResult.error) {
      diagnostics.stages.adminLogin = {
        success: false,
        error: { message: signInResult.error.message, status: signInResult.error.status }
      };
    } else {
      const { data, error } = await authClient
        .from('competition_entries')
        .select('id, email, full_name, payment_status')
        .neq('email', 'admin1@ncc.id')
        .limit(5);

      diagnostics.stages.adminLogin = {
        success: !error,
        loginSuccess: true,
        count: data?.length || 0,
        error: error ? { message: error.message, details: error.details, code: error.code } : null,
        sample: data || []
      };
    }
  } catch (err: any) {
    diagnostics.stages.adminLogin = {
      success: false,
      error: { exception: err.message || err }
    };
  }

  // --- DIAGNOSTIC 3: Anonymous Query ---
  try {
    const authClient = createSupabaseClient(supabaseUrl, anonKey);
    const { data, error } = await authClient
      .from('competition_entries')
      .select('id, email, full_name, payment_status')
      .limit(5);

    diagnostics.stages.anonymousQuery = {
      success: !error,
      count: data?.length || 0,
      error: error ? { message: error.message, details: error.details, code: error.code } : null,
      sample: data || []
    };
  } catch (err: any) {
    diagnostics.stages.anonymousQuery = {
      success: false,
      error: { exception: err.message || err }
    };
  }

  return NextResponse.json(diagnostics);
}

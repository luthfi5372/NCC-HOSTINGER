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

      // Query cbt_exams
      const { data: exams, error: examsErr } = await serviceClient
        .from('cbt_exams')
        .select('*');

      // Query cbt_questions count
      const { count: questionsCount, error: questionsErr } = await serviceClient
        .from('cbt_questions')
        .select('*', { count: 'exact', head: true });

      // Query cbt_attempts count
      const { count: attemptsCount, error: attemptsErr } = await serviceClient
        .from('cbt_attempts')
        .select('*', { count: 'exact', head: true });

      diagnostics.stages.serviceRole = {
        success: !error,
        count: data?.length || 0,
        error: error ? { message: error.message, details: error.details, code: error.code } : null,
        sample: data || [],
        cbt: {
          exams: exams || [],
          examsError: examsErr ? { message: examsErr.message, code: examsErr.code } : null,
          questionsCount: questionsCount || 0,
          questionsError: questionsErr ? { message: questionsErr.message, code: questionsErr.code } : null,
          attemptsCount: attemptsCount || 0,
          attemptsError: attemptsErr ? { message: attemptsErr.message, code: attemptsErr.code } : null
        }
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

  // --- DIAGNOSTIC 4: getLLMSTelemetryData Action Call ---
  try {
    const { getLLMSTelemetryData } = await import('@/app/actions/auth');
    const actionResult = await getLLMSTelemetryData();
    diagnostics.stages.telemetryAction = {
      success: !actionResult.error,
      error: actionResult.error,
      questionCount: actionResult.questionCount,
      examsCount: actionResult.examsData?.length || 0,
      exams: actionResult.examsData
    };
  } catch (err: any) {
    diagnostics.stages.telemetryAction = {
      success: false,
      error: { exception: err.message || err }
    };
  }

  return NextResponse.json(diagnostics);
}

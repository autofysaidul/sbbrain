import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let queryResult = null;
  let queryError = null;

  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .limit(1);
    
    queryResult = data;
    queryError = error;
  } catch (err: any) {
    queryError = { message: err.message, stack: err.stack };
  }

  return NextResponse.json({
    urlExists: !!url,
    urlValue: url ? url.substring(0, 15) + '...' : null,
    keyExists: !!key,
    keyValueLength: key ? key.length : 0,
    queryResult,
    queryError
  });
}

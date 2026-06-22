import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

// GET: Fetch all sessions for a specific client
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'clientId parameter is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching sessions from Supabase:', error);
      return NextResponse.json({ error: 'Failed to retrieve sessions.' }, { status: 500 });
    }

    // Map database fields to client format
    const sessions = (data || []).map(session => ({
      id: session.id,
      title: session.title,
      createdAt: session.created_at
    }));

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error('Error fetching sessions API:', error);
    return NextResponse.json({ error: 'Failed to retrieve sessions.' }, { status: 500 });
  }
}

// POST: Create or upsert a session
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, title, clientId } = body;

    if (!id || !title || !clientId) {
      return NextResponse.json({ error: 'id, title, and clientId are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('sessions')
      .upsert({
        id,
        title,
        client_id: clientId,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error saving session to Supabase:', error);
      return NextResponse.json({ error: 'Failed to save session.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, session: data?.[0] });
  } catch (error: any) {
    console.error('Error saving session API:', error);
    return NextResponse.json({ error: 'Failed to save session.' }, { status: 500 });
  }
}

// DELETE: Delete a session
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId parameter is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('Error deleting session from Supabase:', error);
      return NextResponse.json({ error: 'Failed to delete session.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting session API:', error);
    return NextResponse.json({ error: 'Failed to delete session.' }, { status: 500 });
  }
}

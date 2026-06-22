import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { parentSessionId, newSessionId, clientId } = body;

    if (!parentSessionId || !newSessionId || !clientId) {
      return NextResponse.json({ error: 'parentSessionId, newSessionId, and clientId are required' }, { status: 400 });
    }

    // 1. Fetch parent session's title
    const { data: parentSession, error: sessionError } = await supabase
      .from('sessions')
      .select('title')
      .eq('id', parentSessionId)
      .single();

    const parentTitle = parentSession?.title || 'Shared Chat';
    // Clean up title (remove " (Copy)" if it's already copied repeatedly, or just keep it simple)
    const newTitle = parentTitle.endsWith(' (Copy)') ? parentTitle : `${parentTitle} (Copy)`;

    // 2. Insert new session row
    const { error: insertSessionError } = await supabase
      .from('sessions')
      .insert({
        id: newSessionId,
        title: newTitle,
        client_id: clientId,
        created_at: new Date().toISOString()
      });

    if (insertSessionError) {
      console.error('Error creating cloned session in Supabase:', insertSessionError);
      return NextResponse.json({ error: 'Failed to create new cloned session.' }, { status: 500 });
    }

    // 3. Fetch all messages belonging to parentSessionId
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', parentSessionId)
      .order('timestamp', { ascending: true });

    if (messagesError) {
      console.error('Error fetching parent messages to clone:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch parent messages.' }, { status: 500 });
    }

    // 4. Batch-insert cloned messages under newSessionId
    if (messages && messages.length > 0) {
      const clonedMessages = messages.map((msg, index) => {
        // Shift timestamp slightly to preserve chronological ordering if needed, or keep existing timestamp
        return {
          id: `msg-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
          session_id: newSessionId,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          client_id: clientId
        };
      });

      const { error: insertMessagesError } = await supabase
        .from('messages')
        .insert(clonedMessages);

      if (insertMessagesError) {
        console.error('Error inserting cloned messages into Supabase:', insertMessagesError);
        return NextResponse.json({ error: 'Failed to clone messages.' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, newSessionId });
  } catch (error: any) {
    console.error('Error in session cloning API:', error);
    return NextResponse.json({ error: 'Failed to clone session.' }, { status: 500 });
  }
}

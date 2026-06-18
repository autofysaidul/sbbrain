import { NextResponse } from 'next/server';
import { getMessagesDecrypted } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || 'default-session';

    const messages = getMessagesDecrypted(sessionId);
    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve message history.' },
      { status: 500 }
    );
  }
}

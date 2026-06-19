import { supabase } from './supabase';

export interface DecryptedMessage {
  id: string;
  sessionId: string;
  timestamp: string;
  role: 'user' | 'assistant';
  content: string;
}

// Save message helper (inserts message to Supabase)
export async function saveMessage(
  role: 'user' | 'assistant',
  content: string,
  sessionId: string,
  clientId?: string
): Promise<DecryptedMessage> {
  const id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const timestamp = new Date().toISOString();

  const { error } = await supabase
    .from('messages')
    .insert({
      id,
      session_id: sessionId,
      role,
      content,
      timestamp,
      client_id: clientId || null
    });

  if (error) {
    console.error('Error saving message to Supabase:', error);
    throw error;
  }

  return {
    id,
    sessionId,
    timestamp,
    role,
    content
  };
}

// Get messages for a specific session (fetches from Supabase)
export async function getMessagesDecrypted(sessionId: string): Promise<DecryptedMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('Error fetching messages from Supabase:', error);
    return [];
  }

  return (data || []).map(msg => ({
    id: msg.id,
    sessionId: msg.session_id,
    timestamp: msg.timestamp,
    role: msg.role as 'user' | 'assistant',
    content: msg.content
  }));
}

// Delete message and all subsequent messages in a session (used for response regeneration)
export async function deleteMessageAndSubsequent(msgId: string, sessionId: string): Promise<void> {
  // 1. Fetch all messages in this session ordered by timestamp
  const { data: messages, error: fetchError } = await supabase
    .from('messages')
    .select('id, timestamp')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true });

  if (fetchError || !messages) {
    console.error('Error fetching messages for deletion:', fetchError);
    return;
  }

  // 2. Find the index of the message to delete
  const index = messages.findIndex(msg => msg.id === msgId);
  if (index === -1) return;

  // 3. Collect ids of this message and all subsequent messages
  const idsToDelete = messages.slice(index).map(msg => msg.id);

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) {
      console.error('Error deleting messages from Supabase:', deleteError);
    }
  }
}

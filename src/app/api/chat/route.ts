import { NextResponse } from 'next/server';
import { saveMessage, deleteMessageAndSubsequent } from '@/lib/db';

// Allow up to 60 seconds for this API route (Vercel/VPS)
export const maxDuration = 60;

export async function POST(request: Request) {
  let activeSessionId = 'default-session';
  let clientId = undefined;
  try {
    const body = await request.json().catch(() => ({}));
    const { message, sessionId, regenerate, assistantMessageId } = body;
    if (body.clientId) {
      clientId = body.clientId;
    }
    
    if (sessionId) {
      activeSessionId = sessionId;
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message content is required and must be a string.' },
        { status: 400 }
      );
    }

    // 1. Handle message cleanup if regenerating, otherwise save the user message
    if (regenerate) {
      if (assistantMessageId) {
        await deleteMessageAndSubsequent(assistantMessageId, activeSessionId);
      }
    } else {
      await saveMessage('user', message, activeSessionId, clientId);
    }

    // 2. Forward message to external webhook with timeout
    const webhookUrl = 'https://admin.n8n.inmetech.cloud/webhook/sb';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        content: message,
        sessionId: activeSessionId,
        sender: 'user',
        timestamp: new Date().toISOString()
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Webhook responded with status ${response.status}`);
    }

    // 3. Parse response from the webhook
    let replyText = '';
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const responseData = await response.json();
      
      // Extract text content dynamically from various formats
      const extractText = (obj: any): string => {
        if (typeof obj === 'string') return obj;
        if (Array.isArray(obj)) {
          if (obj.length > 0) {
            return extractText(obj[0]);
          }
          return '';
        }
        if (obj && typeof obj === 'object') {
          // Check common key names returned by n8n or LLM node outputs
          const keysToCheck = ['output', 'response', 'text', 'message', 'data', 'content', 'reply', 'result'];
          for (const key of keysToCheck) {
            if (obj[key] !== undefined && typeof obj[key] === 'string') {
              return obj[key];
            }
            if (obj[key] !== undefined && typeof obj[key] === 'object') {
              const nested = extractText(obj[key]);
              if (nested) return nested;
            }
          }
          // Fallback: search values inside object
          for (const value of Object.values(obj)) {
            if (typeof value === 'string') return value;
          }
        }
        return JSON.stringify(obj);
      };

      replyText = extractText(responseData);
    } else {
      replyText = await response.text();
    }

    // Fallback if the webhook response is empty
    replyText = replyText.trim() || 'No response content was returned by the webhook.';

    // 4. Save AI/assistant reply to database (encrypted under activeSessionId)
    const savedAssistantMsg = await saveMessage('assistant', replyText, activeSessionId, clientId);

    return NextResponse.json({ reply: savedAssistantMsg });
  } catch (error: any) {
    console.error('Error handling chat API route:', error);
    
    const errorMsg = `Sorry, I encountered an error communicating with the webhook: ${error.message}`;
    const savedAssistantMsg = await saveMessage('assistant', errorMsg, activeSessionId, clientId);
    
    return NextResponse.json({ reply: savedAssistantMsg }, { status: 500 });
  }
}

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'chat_db.json');

// Get or derive encryption key
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || 'default-secret-fallback-key-32-chars-long-!!!';
  // Use PBKDF2 or scrypt to derive a robust 32-byte key from whatever string is provided
  return crypto.scryptSync(secret, 'salt-for-dazzling-faraday', 32);
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

interface EncryptedPayload {
  iv: string;
  encryptedData: string;
  authTag: string;
}

export function encrypt(text: string): EncryptedPayload {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag
  };
}

export function decrypt(payload: EncryptedPayload): string {
  const iv = Buffer.from(payload.iv, 'hex');
  const encryptedData = payload.encryptedData;
  const authTag = Buffer.from(payload.authTag, 'hex');
  const key = getEncryptionKey();
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export interface Message {
  id: string;
  sessionId: string;
  timestamp: string;
  role: 'user' | 'assistant';
  // Encrypted fields stored in DB
  iv: string;
  content: string; // encrypted hex
  authTag: string;
}

export interface DecryptedMessage {
  id: string;
  sessionId: string;
  timestamp: string;
  role: 'user' | 'assistant';
  content: string; // decrypted plaintext
}

// Read database from file
export function readDB(): Message[] {
  if (!fs.existsSync(DB_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data) as Message[];
  } catch (error) {
    console.error('Error reading chat database file:', error);
    return [];
  }
}

// Write database to file
export function writeDB(messages: Message[]): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(messages, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing chat database file:', error);
  }
}

// Save message helper
export function saveMessage(role: 'user' | 'assistant', content: string, sessionId: string): DecryptedMessage {
  const messages = readDB();
  const encrypted = encrypt(content);
  
  const newMessage: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    sessionId,
    timestamp: new Date().toISOString(),
    role,
    iv: encrypted.iv,
    content: encrypted.encryptedData,
    authTag: encrypted.authTag
  };
  
  messages.push(newMessage);
  writeDB(messages);
  
  return {
    id: newMessage.id,
    sessionId: newMessage.sessionId,
    timestamp: newMessage.timestamp,
    role: newMessage.role,
    content: content
  };
}

// Get messages decrypted for a specific session
export function getMessagesDecrypted(sessionId: string): DecryptedMessage[] {
  const allMessages = readDB();
  const sessionMessages = allMessages.filter(msg => msg.sessionId === sessionId);
  
  return sessionMessages.map(msg => {
    try {
      const decryptedContent = decrypt({
        iv: msg.iv,
        encryptedData: msg.content,
        authTag: msg.authTag
      });
      return {
        id: msg.id,
        sessionId: msg.sessionId,
        timestamp: msg.timestamp,
        role: msg.role,
        content: decryptedContent
      };
    } catch (err) {
      console.error(`Failed to decrypt message ${msg.id}:`, err);
      return {
        id: msg.id,
        sessionId: msg.sessionId,
        timestamp: msg.timestamp,
        role: msg.role,
        content: '[Decryption Error: Invalid key or corrupted data]'
      };
    }
  });
}

// Delete message and all subsequent messages in a session (used for response regeneration)
export function deleteMessageAndSubsequent(msgId: string, sessionId: string): void {
  const messages = readDB();
  const index = messages.findIndex(msg => msg.id === msgId);
  if (index === -1) return;

  const filtered = messages.filter((msg, idx) => {
    if (msg.sessionId !== sessionId) return true;
    return idx < index;
  });

  writeDB(filtered);
}


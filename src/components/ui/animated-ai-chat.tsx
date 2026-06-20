"use client";

import { useEffect, useRef, useCallback, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import {
    ImageIcon,
    MonitorIcon,
    CircleUserRound,
    Paperclip,
    LoaderIcon,
    Sparkles,
    Command,
    XIcon,
    SendIcon,
    PlusIcon,
    Trash2,
    Menu,
    ChevronLeft,
    Copy,
    Check,
    ThumbsUp,
    ThumbsDown,
    RotateCw,
    Sun,
    Moon,
    Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react"
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessage {
    id: string;
    timestamp: string;
    role: "user" | "assistant";
    content: string;
    responseTime?: number; // seconds it took to get this response
}

interface Session {
    id: string;
    title: string;
    createdAt: string;
}

function Figma(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
      <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
      <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" />
      <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" />
      <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" />
    </svg>
  );
}

function preprocessMarkdown(content: string): string {
    if (!content) return "";
    // Replace raw HTML br tags with newlines
    return content.replace(/<br\s*\/?>/gi, "\n");
}

function getCleanSiteName(urlStr: string): string {
    if (!urlStr) return "";
    
    // Remove protocol and www.
    let clean = urlStr.replace(/^(https?:\/\/)?(www\.)?/, "");
    
    const lower = clean.toLowerCase();
    if (lower.startsWith("github.com")) {
        const parts = clean.split("/");
        if (parts.length > 1 && parts[1]) {
            return `GitHub (${parts[1]})`;
        }
        return "GitHub";
    }
    if (lower.startsWith("twitter.com") || lower.startsWith("x.com")) return "Twitter/X";
    if (lower.startsWith("linkedin.com")) return "LinkedIn";
    if (lower.startsWith("facebook.com")) return "Facebook";
    if (lower.startsWith("youtube.com")) return "YouTube";
    if (lower.startsWith("wikipedia.org")) return "Wikipedia";
    
    // Split by path and get the host
    const host = clean.split("/")[0];
    
    // Split host by dots
    const parts = host.split(".");
    if (parts.length > 0) {
        const tlds = ["com", "org", "net", "edu", "gov", "mil", "co", "io", "eu", "cloud", "me", "info", "biz", "us", "uk", "ca", "de", "jp", "fr"];
        const filtered = parts.filter(p => !tlds.includes(p.toLowerCase()));
        
        if (filtered.length > 0) {
            return filtered
                .map(part => 
                    part.split("-")
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")
                )
                .join(" ");
        }
    }
    
    return host;
}

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                textarea.style.overflowY = "hidden";
                return;
            }

            textarea.style.height = `${minHeight}px`;
            const scrollHeight = textarea.scrollHeight;
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
            
            if (maxHeight && scrollHeight > maxHeight) {
                textarea.style.overflowY = "auto";
            } else {
                textarea.style.overflowY = "hidden";
            }
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
            textarea.style.overflowY = "hidden";
        }
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

interface CommandSuggestion {
    icon: React.ReactNode;
    label: string;
    description: string;
    prefix: string;
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    
    return (
      <div className={cn(
        "relative",
        containerClassName
      )}>
        <textarea
          className={cn(
            "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing ? "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0" : "",
            className
          )}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {showRing && isFocused && (
          <motion.span 
            className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-offset-0 ring-violet-500/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {props.onChange && (
          <div 
            className="absolute bottom-2 right-2 opacity-0 w-2 h-2 bg-violet-500 rounded-full"
            style={{
              animation: 'none',
            }}
            id="textarea-ripple"
          />
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

function generateUUID(): string {
    if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
        try {
            return window.crypto.randomUUID();
        } catch (e) {
            // fallback
        }
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function AnimatedAIChat() {
    const [value, setValue] = useState("");
    const [attachments, setAttachments] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [recentCommand, setRecentCommand] = useState<string | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 36,
        maxHeight: 140,
    });
    const [inputFocused, setInputFocused] = useState(false);
    const commandPaletteRef = useRef<HTMLDivElement>(null);
    
    // Multi-session management states
    const [sessions, setSessions] = useState<Session[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string>("");
    const [clientId, setClientId] = useState<string>("");
    const [sharedParentId, setSharedParentId] = useState<string | null>(null);
    const [shareCopied, setShareCopied] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    
    // Live messages state loaded from encrypted backend db based on activeSessionId
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Feedback & Copy Utility States
    const [ratings, setRatings] = useState<Record<string, 'like' | 'dislike'>>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Theme state (follows system preference by default)
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    // Response timer state
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const sendTimestampRef = useRef<number>(0);

    // Initialize theme from system preference or localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored = localStorage.getItem('dazzling_faraday_theme') as 'dark' | 'light' | null;
        if (stored) {
            setTheme(stored);
            document.documentElement.setAttribute('data-theme', stored);
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const systemTheme = prefersDark ? 'dark' : 'light';
            setTheme(systemTheme);
            document.documentElement.setAttribute('data-theme', systemTheme);
        }

        // Listen for system preference changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => {
            if (!localStorage.getItem('dazzling_faraday_theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                setTheme(newTheme);
                document.documentElement.setAttribute('data-theme', newTheme);
            }
        };
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('dazzling_faraday_theme', newTheme);
    };

    // Start/stop live timer for response
    const startTimer = () => {
        sendTimestampRef.current = Date.now();
        setElapsedSeconds(0);
        timerIntervalRef.current = setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - sendTimestampRef.current) / 1000));
        }, 1000);
    };

    const stopTimer = (): number => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        const elapsed = (Date.now() - sendTimestampRef.current) / 1000;
        setElapsedSeconds(0);
        return Math.round(elapsed * 10) / 10; // round to 1 decimal
    };

    const commandSuggestions: CommandSuggestion[] = [
        { 
            icon: <Sparkles className="w-4 h-4 text-violet-400" />, 
            label: "What is Social Business?", 
            description: "Learn about the concept of Social Business", 
            prefix: "What is Social Business?" 
        },
        { 
            icon: <Sparkles className="w-4 h-4 text-indigo-400" />, 
            label: "Who's speaking at 3 PM?", 
            description: "Check event speaker scheduling", 
            prefix: "Who's speaking at 3 PM?" 
        },
        { 
            icon: <Sparkles className="w-4 h-4 text-fuchsia-400" />, 
            label: "Explain the Yunus model", 
            description: "Yunus Social Business Model overview", 
            prefix: "Explain the Yunus model" 
        },
        { 
            icon: <Sparkles className="w-4 h-4 text-pink-400" />, 
            label: "Grameen Bank case study", 
            description: "Review the Grameen Bank case study", 
            prefix: "Grameen Bank case study" 
        },
    ];

    const comingSoonItems = [
        { name: "SB Validator", color: "from-emerald-400 to-teal-500" },
        { name: "SB Canvas", color: "from-blue-400 to-indigo-500" },
        { name: "SB KPI Engine", color: "from-amber-400 to-orange-500" },
        { name: "SB Grant Writer", color: "from-fuchsia-400 to-pink-500" },
        { name: "SB Academy", color: "from-violet-400 to-purple-500" },
        { name: "Announcements", color: "from-cyan-400 to-sky-500" },
        { name: "SB News", color: "from-rose-400 to-red-500" },
        { name: "Soon", color: "from-indigo-400 to-violet-500" },
        { name: "SB Events", color: "from-teal-400 to-emerald-500" }
    ];


    // 0. Initialize Client ID (must be a valid UUID for database uuid type compatibility)
    useEffect(() => {
        if (typeof window !== "undefined") {
            let id = localStorage.getItem("dazzling_faraday_client_id");
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id || "");
            if (!id || !isUUID) {
                id = generateUUID();
                localStorage.setItem("dazzling_faraday_client_id", id);
            }
            setClientId(id);
        }
    }, []);

    // 1. Initial Load of Sessions from Supabase
    useEffect(() => {
        if (!clientId) return;

        const loadSessions = async () => {
            // Check if there is a shared session in the URL
            const urlParams = new URLSearchParams(window.location.search);
            const sharedSessionId = urlParams.get('share');

            if (sharedSessionId) {
                setSharedParentId(sharedSessionId);
                setActiveSessionId(sharedSessionId);
                
                // Fetch the user's regular sessions in the background to populate the sidebar
                try {
                    const response = await fetch(`/api/sessions?clientId=${clientId}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.sessions) {
                            setSessions(data.sessions);
                        }
                    }
                } catch (error) {
                    console.error("Failed to load sessions in background:", error);
                }
                return;
            }

            try {
                const response = await fetch(`/api/sessions?clientId=${clientId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.sessions && data.sessions.length > 0) {
                        setSessions(data.sessions);
                        
                        const storedActive = localStorage.getItem("dazzling_faraday_active_session");
                        const isValidActive = data.sessions.some((s: any) => s.id === storedActive);
                        
                        if (storedActive && isValidActive) {
                            setActiveSessionId(storedActive);
                        } else {
                            setActiveSessionId(data.sessions[0].id);
                            localStorage.setItem("dazzling_faraday_active_session", data.sessions[0].id);
                        }
                    } else {
                        await initializeDefaultSession();
                    }
                } else {
                    await initializeDefaultSession();
                }
            } catch (error) {
                console.error("Failed to fetch sessions from Supabase:", error);
                await initializeDefaultSession();
            }
        };

        loadSessions();
    }, [clientId]);

    const initializeDefaultSession = async () => {
        if (!clientId) return;
        const defaultSessionId = `session-${Date.now()}`;
        const defaultSession: Session = {
            id: defaultSessionId,
            title: "Chat Session 1",
            createdAt: new Date().toISOString()
        };
        
        setSessions([defaultSession]);
        setActiveSessionId(defaultSessionId);
        localStorage.setItem("dazzling_faraday_active_session", defaultSessionId);
        
        try {
            await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: defaultSessionId,
                    title: "Chat Session 1",
                    clientId
                })
            });
        } catch (error) {
            console.error("Failed to create default session on Supabase:", error);
        }
    };

    // 2. Load message history when activeSessionId changes
    useEffect(() => {
        if (!activeSessionId) return;

        const fetchHistory = async () => {
            try {
                const response = await fetch(`/api/history?sessionId=${activeSessionId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.messages) {
                        setMessages(data.messages);
                    }
                }
            } catch (error) {
                console.error("Failed to load chat history:", error);
            }
        };
        fetchHistory();
    }, [activeSessionId]);

    // Auto-scroll messages to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // Handle session creation
    const handleCreateSession = async () => {
        if (!clientId) return;
        const newId = `session-${Date.now()}`;
        const newSession: Session = {
            id: newId,
            title: `Chat Session ${sessions.length + 1}`,
            createdAt: new Date().toISOString()
        };
        
        const updated = [...sessions, newSession];
        setSessions(updated);
        setActiveSessionId(newId);
        localStorage.setItem("dazzling_faraday_active_session", newId);
        
        try {
            await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: newId,
                    title: newSession.title,
                    clientId
                })
            });
        } catch (error) {
            console.error("Failed to create session on Supabase:", error);
        }
    };

    // Handle session deletion
    const handleDeleteSession = async (e: React.MouseEvent, sessionIdToDelete: string) => {
        e.stopPropagation();
        const updated = sessions.filter(s => s.id !== sessionIdToDelete);
        
        if (updated.length === 0) {
            await initializeDefaultSession();
            return;
        }

        setSessions(updated);

        // If we deleted the active session, switch to the last remaining one
        if (activeSessionId === sessionIdToDelete) {
            const newActive = updated[updated.length - 1].id;
            setActiveSessionId(newActive);
            localStorage.setItem("dazzling_faraday_active_session", newActive);
        }

        try {
            await fetch(`/api/sessions?sessionId=${sessionIdToDelete}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error("Failed to delete session on Supabase:", error);
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [value, adjustHeight]);

    useEffect(() => {
        if (value.startsWith('/') && !value.includes(' ')) {
            setShowCommandPalette(true);
            
            const matchingSuggestionIndex = commandSuggestions.findIndex(
                (cmd) => cmd.prefix.startsWith(value)
            );
            
            if (matchingSuggestionIndex >= 0) {
                setActiveSuggestion(matchingSuggestionIndex);
            } else {
                setActiveSuggestion(-1);
            }
        } else {
            setShowCommandPalette(false);
        }
    }, [value]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const commandButton = document.querySelector('[data-command-button]');
            
            if (commandPaletteRef.current && 
                !commandPaletteRef.current.contains(target) && 
                !commandButton?.contains(target)) {
                setShowCommandPalette(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showCommandPalette) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev < commandSuggestions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev > 0 ? prev - 1 : commandSuggestions.length - 1
                );
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault();
                if (activeSuggestion >= 0) {
                    const selectedCommand = commandSuggestions[activeSuggestion];
                    setValue(selectedCommand.prefix + ' ');
                    setShowCommandPalette(false);
                    
                    setRecentCommand(selectedCommand.label);
                    setTimeout(() => setRecentCommand(null), 3500);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowCommandPalette(false);
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
                handleSendMessage();
            }
        }
    };

    const handleSendMessage = async (overrideText?: string) => {
        const messageToSend = (overrideText || value).trim();
        if (messageToSend && activeSessionId) {
            setValue("");
            adjustHeight(true);

            let currentSessionId = activeSessionId;

            // If we are previewing a shared session, clone it to a new session for the user first
            if (sharedParentId) {
                const newId = `session-${Date.now()}`;
                const newSession: Session = {
                    id: newId,
                    title: sessions.find(s => s.id === sharedParentId)?.title || "Shared Chat Copy",
                    createdAt: new Date().toISOString()
                };

                // Add to local sessions list
                setSessions(prev => [...prev, newSession]);
                setActiveSessionId(newId);
                localStorage.setItem("dazzling_faraday_active_session", newId);
                
                // Clear shared parent state and clean URL
                setSharedParentId(null);
                currentSessionId = newId;

                const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({ path: cleanUrl }, '', cleanUrl);

                // Call clone API to copy the session and its messages in the database
                try {
                    await fetch('/api/sessions/clone', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            parentSessionId: sharedParentId,
                            newSessionId: newId,
                            clientId: clientId
                        })
                    });
                } catch (error) {
                    console.error("Failed to clone session in database:", error);
                }
            } else {
                // Auto-rename session based on the first message
                if (messages.length === 0) {
                    const words = messageToSend.split(/\s+/).filter(Boolean);
                    const newTitle = words.length > 3 
                        ? words.slice(0, 3).join(" ") + "..." 
                        : messageToSend;
                    
                    setSessions(prev => {
                        const updated = prev.map(s => {
                            if (s.id === activeSessionId) {
                                return { ...s, title: newTitle };
                            }
                            return s;
                        });
                        return updated;
                    });

                    // Ensure session exists in Supabase BEFORE sending the message
                    // (the message insert will fail with FK violation if session doesn't exist)
                    try {
                        await fetch('/api/sessions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id: activeSessionId,
                                title: newTitle,
                                clientId
                            })
                        });
                    } catch (err) {
                        console.error("Failed to create session before first message:", err);
                    }
                }
            }

            // Add user message locally for instant UI response
            const tempUserMsg: ChatMessage = {
                id: `temp-user-${Date.now()}`,
                timestamp: new Date().toISOString(),
                role: "user",
                content: messageToSend,
            };
            setMessages(prev => [...prev, tempUserMsg]);
            setIsTyping(true);
            startTimer();

            startTransition(async () => {
                try {
                    const response = await fetch("/api/chat", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ 
                            message: messageToSend,
                            sessionId: currentSessionId,
                            clientId
                        }),
                    });

                    const responseTime = stopTimer();

                    if (response.ok) {
                        const data = await response.json();
                        if (data.reply) {
                            // Update history with the saved assistant reply, and swap temp user msg
                            setMessages(prev => {
                                const listWithoutTemp = prev.filter(m => m.id !== tempUserMsg.id);
                                return [
                                    ...listWithoutTemp,
                                    { ...tempUserMsg, id: `msg-user-${Date.now()}` },
                                    { ...data.reply, responseTime }
                                ];
                            });
                        }
                    } else {
                        // Display error bubble
                        setMessages(prev => [
                            ...prev,
                            {
                                id: `error-${Date.now()}`,
                                timestamp: new Date().toISOString(),
                                role: "assistant",
                                content: "Unable to retrieve response. Check console or backend logs.",
                            }
                        ]);
                    }
                } catch (error) {
                    stopTimer();
                    console.error("Error sending message:", error);
                    setMessages(prev => [
                        ...prev,
                        {
                            id: `error-${Date.now()}`,
                            timestamp: new Date().toISOString(),
                            role: "assistant",
                            content: "Network error occurred. Please verify backend is running.",
                        }
                    ]);
                } finally {
                    setIsTyping(false);
                }
            });
        }
    };

    const handleAttachFile = () => {
        const mockFileName = `file-${Math.floor(Math.random() * 1000)}.pdf`;
        setAttachments(prev => [...prev, mockFileName]);
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };
    
    const selectCommandSuggestion = (index: number) => {
        const selectedCommand = commandSuggestions[index];
        setValue(selectedCommand.prefix);
        setShowCommandPalette(false);
        
        setRecentCommand(selectedCommand.label);
        setTimeout(() => setRecentCommand(null), 2000);
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleRate = (id: string, type: 'like' | 'dislike') => {
        setRatings(prev => {
            const current = prev[id];
            if (current === type) {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            }
            return { ...prev, [id]: type };
        });
    };

    const handleShare = () => {
        if (!activeSessionId) return;
        const shareUrl = `${window.location.origin}?share=${activeSessionId}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 2000);
        }).catch(err => {
            console.error("Failed to copy share link:", err);
        });
    };

    const handleRegenerate = async (msgId: string) => {
        const index = messages.findIndex(m => m.id === msgId);
        if (index <= 0) return;

        const precedingMsg = messages[index - 1];
        if (precedingMsg.role !== 'user') return;

        // Truncate messages in local state from this assistant message onwards
        setMessages(prev => prev.slice(0, index));
        setIsTyping(true);
        startTimer();

        startTransition(async () => {
            try {
                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ 
                        message: precedingMsg.content,
                        sessionId: activeSessionId,
                        regenerate: true,
                        assistantMessageId: msgId,
                        clientId
                    }),
                });

                const responseTime = stopTimer();

                if (response.ok) {
                    const data = await response.json();
                    if (data.reply) {
                        setMessages(prev => [...prev, { ...data.reply, responseTime }]);
                    }
                } else {
                    setMessages(prev => [
                        ...prev,
                        {
                            id: `error-${Date.now()}`,
                            timestamp: new Date().toISOString(),
                            role: "assistant",
                            content: "Unable to regenerate response. Check backend logs.",
                        }
                    ]);
                }
            } catch (error) {
                stopTimer();
                console.error("Error regenerating response:", error);
                setMessages(prev => [
                    ...prev,
                    {
                        id: `error-${Date.now()}`,
                        timestamp: new Date().toISOString(),
                        role: "assistant",
                        content: "Network error occurred during regeneration.",
                    }
                ]);
            } finally {
                setIsTyping(false);
            }
        });
    };

    return (
        <div className="d-flex">
            {/* Mobile overlay */}
            <div 
                className={`sbb-sidebar-overlay ${isSidebarOpen ? 'show' : ''}`} 
                onClick={() => setIsSidebarOpen(false)}
            ></div>

            {/* SIDEBAR */}
            <aside className={`sbb-sidebar ${isSidebarOpen ? 'show' : ''}`} id="sbbSidebar">
                <div className="sbb-sidebar-head mb-1">
                    <div className="d-flex align-items-center gap-2">
                        <div className="sbb-logo-mark">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M3 4L12 20L21 4" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <div className="sbb-brand-name">SB Brain</div>
                    </div>
                    <button className="sbb-sidebar-close" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    </button>
                </div>

                <div className="sbb-nav-section-label">Workspace</div>
                <button className="sbb-nav-link active" onClick={handleCreateSession}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Ask the Brain
                </button>

                <div className="sbb-nav-section-label mt-4">History</div>
                {sessions.map(s => (
                    <button 
                        key={s.id} 
                        className={`sbb-nav-link ${s.id === activeSessionId ? 'active' : ''}`} 
                        onClick={() => { setActiveSessionId(s.id); setIsSidebarOpen(false); }}
                        style={{ fontSize: '0.85rem' }}
                    >
                        {s.title}
                    </button>
                ))}
            </aside>

            {/* MAIN */}
            <main className="sbb-main">
                <div className="sbb-topbar">
                    <div className="d-flex align-items-center gap-3">
                        <button className="btn btn-sm d-lg-none border-0 p-0" onClick={() => setIsSidebarOpen(true)} style={{ color: 'var(--ink)' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        </button>
                        <span className="sbb-topbar-title">The AI Brain for Social Business</span>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        <span className="badge rounded-pill d-none d-sm-inline-block" style={{ background: 'var(--panel)', color: 'var(--teal-deep)', fontWeight: 500 }}>Knowledge base: live</span>
                        <div className="dropdown">
                            <button className="sbb-user-trigger" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <span className="sbb-user-avatar">SR</span>
                                <span className="d-none d-md-block text-start">
                                    <span className="sbb-user-name d-block">Saidul Haque</span>
                                    <span className="sbb-user-role d-block">Administrator</span>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {messages.length === 0 ? (
                    <>
                        {/* HERO */}
                        <section className="sbb-hero" id="sbbHero">
                            <div className="sbb-avatar-ring">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 4L12 20L21 4" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <h1 className="font-display">Hi, I&apos;m the Social Business Brain</h1>
                            <p className="lead-sub">One knowledge base. Every concept, model, case study, and event — answered in one place.</p>

                            <div className="sbb-convergence" aria-hidden="true">
                                <span className="conv-tag t1">news & media</span>
                                <span className="conv-tag t2">events</span>
                                <span className="conv-tag t3">sb world</span>
                                <span className="conv-tag t4">sb wiki</span>
                                <span className="conv-tag t5">academia</span>
                                <span className="conv-tag t6">design lab</span>
                            </div>

                            <div className="sbb-input-card">
                                <textarea 
                                    rows={1} 
                                    placeholder="Ask Social Business Brain"
                                    value={value}
                                    onChange={(e) => {
                                        setValue(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (value.trim() && !isPending) handleSendMessage();
                                        }
                                    }}
                                />
                                <div className="sbb-input-toolbar">
                                    <div className="d-flex gap-2">
                                        <button className="sbb-chip-btn">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                            Add source
                                        </button>
                                        <button className="sbb-chip-btn">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 3v4M12 17v4M5 12H3M21 12h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/></svg>
                                            Auto Model
                                        </button>
                                    </div>
                                    <button 
                                        className="sbb-send-btn" 
                                        onClick={() => handleSendMessage()} 
                                        disabled={isPending || !value.trim()}
                                    >
                                        {isPending ? <div className="spinner-border spinner-border-sm" /> : <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    </button>
                                </div>
                            </div>

                            <div className="sbb-topics">
                                {commandSuggestions.map((cmd, idx) => (
                                    <button 
                                        key={idx} 
                                        className="sbb-topic-pill sbb-topic-pill-btn"
                                        onClick={() => {
                                            setValue(cmd.label);
                                            setTimeout(() => handleSendMessage(cmd.label), 50);
                                        }}
                                    >
                                        <span className="dot" style={idx % 2 !== 0 ? { background: 'var(--gold)' } : {}}></span>
                                        {cmd.label}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* TRENDING SB NEWS */}
                        <section className="sbb-phase2" id="sbbNewsSection">
                            <div className="sbb-phase2-head">
                                <h2 className="font-display">Trending SB News</h2>
                                <span className="eyebrow">From Social Business Pedia</span>
                            </div>
                            <div className="row g-3">
                                <div className="col-md-6 col-lg-4">
                                    <a href="#" className="news-card">
                                        <span className="news-tag">News</span>
                                        <h3>Grameen Nobin entrepreneurs cross 500 active ventures milestone</h3>
                                        <p>A look at how grassroots social businesses are scaling across rural Bangladesh this quarter.</p>
                                        <span className="news-date">2 days ago</span>
                                    </a>
                                </div>
                                <div className="col-md-6 col-lg-4">
                                    <a href="#" className="news-card">
                                        <span className="news-tag">Event</span>
                                        <h3>Social Business Day 2026: registrations now open</h3>
                                        <p>Speakers, sessions, and workshops confirmed for this year&apos;s flagship gathering.</p>
                                        <span className="news-date">4 days ago</span>
                                    </a>
                                </div>
                                <div className="col-md-6 col-lg-4">
                                    <a href="#" className="news-card">
                                        <span className="news-tag">Academia</span>
                                        <h3>New research paper on the Yunus Social Business Model published</h3>
                                        <p>Fresh academic analysis on applying the seven principles in emerging markets.</p>
                                        <span className="news-date">1 week ago</span>
                                    </a>
                                </div>
                            </div>
                        </section>
                        
                        <footer className="sbb-footer" id="sbbFooter">
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <div className="sbb-logo-mark" style={{ width: '28px', height: '28px' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 4L12 20L21 4" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                                <h5 className="mb-0">Social Business Brain</h5>
                            </div>
                            <p className="mb-2" style={{ maxWidth: '680px' }}>A unified knowledge engine for Social Business Pedia — one brain holding every concept, model, case study, and live event, so any question gets one clear answer.</p>
                            <p style={{ color: '#C77E96', maxWidth: '680px' }}>Built on the Social Business Pedia knowledge base. Continuously updated as new sessions, speakers, and case studies are added.</p>

                            <div className="sbb-footer-bottom">
                                <span>© 2026 Social Business Pedia — Social Impact Hub</span>
                                <a href="https://autofysolutions.com" target="_blank" rel="noopener noreferrer" className="sbb-credit-link">
                                    Developed by Autofy Solutions — empowering grassroots entrepreneurs through technology, systemization & education
                                </a>
                            </div>
                        </footer>
                    </>
                ) : (
                    <>
                        {/* CHAT AREA */}
                        <div className="sbb-chat-area show" id="sbbChatArea">
                            <div className="sbb-chat-inner" id="sbbChatInner">
                                {messages.map((msg) => (
                                    msg.role === 'user' ? (
                                        <div key={msg.id} className="sbb-chat-user-msg">
                                            {msg.content}
                                        </div>
                                    ) : (
                                        <div key={msg.id} className="sbb-chat-response mb-4">
                                            <div className="resp-head">
                                                <span className="resp-avatar">
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 4L12 20L21 4" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                </span>
                                                Social Business Brain
                                            </div>
                                            <div className="prose prose-sm max-w-none text-[var(--ink)]">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {preprocessMarkdown(msg.content)}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )
                                ))}
                                
                                {isPending && (
                                    <div className="sbb-chat-loading">
                                        <div className="spinner-border spinner-border-sm text-secondary" role="status"></div>
                                        <span>Social Business Brain is thinking…</span>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* BOTTOM-DOCKED INPUT */}
                        <div className="sbb-input-dock" id="sbbInputDock">
                            <div className="sbb-input-card">
                                <textarea 
                                    rows={1} 
                                    placeholder="Ask Social Business Brain"
                                    value={value}
                                    onChange={(e) => {
                                        setValue(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (value.trim() && !isPending) handleSendMessage();
                                        }
                                    }}
                                />
                                <div className="sbb-input-toolbar">
                                    <div className="d-flex gap-2">
                                        <button className="sbb-chip-btn">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                                            Add source
                                        </button>
                                        <button className="sbb-chip-btn">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 3v4M12 17v4M5 12H3M21 12h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/></svg>
                                            Auto Model
                                        </button>
                                    </div>
                                    <button 
                                        className="sbb-send-btn" 
                                        onClick={() => handleSendMessage()}
                                        disabled={isPending || !value.trim()}
                                    >
                                        {isPending ? <div className="spinner-border spinner-border-sm" /> : <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

function TypingDots() {
    return (
        <div className="flex items-center gap-1.5 ml-1">
            {[
                { color: "bg-violet-400", glow: "rgba(139, 92, 246, 0.6)" },
                { color: "bg-fuchsia-400", glow: "rgba(236, 72, 153, 0.6)" },
                { color: "bg-indigo-400", glow: "rgba(99, 102, 241, 0.6)" }
            ].map((dot, idx) => (
                <motion.div
                    key={idx}
                    className={cn("w-2 h-2 rounded-full", dot.color)}
                    initial={{ y: 0 }}
                    animate={{ 
                        y: [0, -6, 0],
                        scale: [1, 1.15, 1],
                    }}
                    transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: idx * 0.15,
                        ease: "easeInOut",
                    }}
                    style={{
                        boxShadow: `0 0 8px ${dot.glow}`
                    }}
                />
            ))}
        </div>
    );
}

const rippleKeyframes = `
@keyframes ripple {
  0% { transform: scale(0.5); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}
`;

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = rippleKeyframes;
    document.head.appendChild(style);
}

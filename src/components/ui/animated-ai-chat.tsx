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
    RotateCw
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    
    // Live messages state loaded from encrypted backend db based on activeSessionId
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Feedback & Copy Utility States
    const [ratings, setRatings] = useState<Record<string, 'like' | 'dislike'>>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);

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


    // 0. Initialize Client ID
    useEffect(() => {
        if (typeof window !== "undefined") {
            let id = localStorage.getItem("dazzling_faraday_client_id");
            if (!id) {
                id = `client-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
                localStorage.setItem("dazzling_faraday_client_id", id);
            }
            setClientId(id);
        }
    }, []);

    // 1. Initial Load of Sessions from Supabase
    useEffect(() => {
        if (!clientId) return;

        const loadSessions = async () => {
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

    const handleSendMessage = () => {
        const messageToSend = value.trim();
        if (messageToSend && activeSessionId) {
            setValue("");
            adjustHeight(true);

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

                // Save updated title to Supabase
                fetch('/api/sessions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: activeSessionId,
                        title: newTitle,
                        clientId
                    })
                }).catch(console.error);
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

            startTransition(async () => {
                try {
                    const response = await fetch("/api/chat", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ 
                            message: messageToSend,
                            sessionId: activeSessionId,
                            clientId
                        }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.reply) {
                            // Update history with the saved assistant reply, and swap temp user msg
                            setMessages(prev => {
                                const listWithoutTemp = prev.filter(m => m.id !== tempUserMsg.id);
                                return [
                                    ...listWithoutTemp,
                                    { ...tempUserMsg, id: `msg-user-${Date.now()}` },
                                    data.reply
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

    const handleRegenerate = async (msgId: string) => {
        const index = messages.findIndex(m => m.id === msgId);
        if (index <= 0) return;

        const precedingMsg = messages[index - 1];
        if (precedingMsg.role !== 'user') return;

        // Truncate messages in local state from this assistant message onwards
        setMessages(prev => prev.slice(0, index));
        setIsTyping(true);

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

                if (response.ok) {
                    const data = await response.json();
                    if (data.reply) {
                        setMessages(prev => [...prev, data.reply]);
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
        <div className="flex h-screen w-screen bg-[#0A0A0B] text-white overflow-hidden relative">
            
            {/* 1. COLLAPSIBLE SIDEBAR */}
            <AnimatePresence initial={false}>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 260, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="h-full bg-black/45 border-r border-white/[0.04] flex flex-col shrink-0 z-40 overflow-hidden relative backdrop-blur-2xl"
                    >
                        {/* Sidebar Header */}
                        <div className="p-4 flex items-center justify-between border-b border-white/[0.04]">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
                                <span className="font-semibold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">SB Brain</span>
                            </div>
                            <button 
                                onClick={() => setIsSidebarOpen(false)}
                                className="p-1 hover:bg-white/[0.05] rounded-md text-white/50 hover:text-white transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        </div>

                        {/* New Chat Button */}
                        <div className="p-3">
                            <button
                                onClick={handleCreateSession}
                                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/10 text-sm font-medium transition-all duration-200"
                            >
                                <PlusIcon className="w-4 h-4 text-violet-400" />
                                <span>New Chat</span>
                            </button>
                        </div>

                        {/* Sessions List & Coming Soon */}
                        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-6 custom-scrollbar">
                            <div className="space-y-1.5">
                                <div className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-2.5 mb-2">Recent Chats</div>
                                {sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        onClick={() => setActiveSessionId(session.id)}
                                        className={cn(
                                            "group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all duration-200",
                                            activeSessionId === session.id
                                                ? "bg-white/[0.05] border border-white/10 text-white font-medium"
                                                : "text-white/60 border border-transparent hover:bg-white/[0.02] hover:text-white/90"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                activeSessionId === session.id ? "bg-violet-400" : "bg-transparent"
                                            )} />
                                            <span className="truncate">{session.title}</span>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteSession(e, session.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-white/40 hover:text-white transition-all duration-200"
                                            title="Delete/Close Session"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Coming Soon / Upcoming Section */}
                            <div className="pt-2 border-t border-white/[0.03]">
                                <div className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-2.5 mb-2.5 flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-violet-400 animate-ping" />
                                    Coming Soon
                                </div>
                                <div className="space-y-0.5">
                                    {comingSoonItems.map((item) => (
                                        <div
                                            key={item.name}
                                            className="group flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-white/40 border border-transparent hover:bg-white/[0.02] hover:text-white/75 transition-all duration-200 cursor-default"
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full bg-gradient-to-r shrink-0 opacity-60 group-hover:opacity-100 transition-opacity",
                                                    item.color
                                                )} />
                                                <span className="truncate">{item.name}</span>
                                            </div>
                                            <span className="text-[8px] font-medium px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.04] text-white/20 group-hover:text-violet-400 group-hover:border-violet-500/25 transition-all">
                                                Soon
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. MAIN CHAT CONTAINER */}
            <div className="flex-1 flex flex-col relative overflow-hidden h-full">
                
                {/* Claude-style top header */}
                <div className="h-14 border-b border-white/[0.04] flex items-center justify-between px-6 bg-transparent shrink-0 z-20 w-full">
                    <div className="flex items-center gap-3 text-xs text-white/40 font-sans">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-1.5 hover:bg-white/[0.05] text-white/70 hover:text-white rounded-lg transition-colors mr-1"
                                title="Expand Sidebar"
                            >
                                <Menu className="w-4 h-4" />
                            </button>
                        )}
                        <span>Books & Workshop</span>
                        <span>/</span>
                        <span className="text-white/80 font-medium truncate max-w-[180px] sm:max-w-[280px]">
                            {sessions.find(s => s.id === activeSessionId)?.title || "Supercommunicators chapter structure and breakdown"}
                        </span>
                        <span className="text-[10px] opacity-60">▼</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] rounded-lg text-xs text-white/70 hover:text-white transition-colors">
                            Share
                        </button>
                    </div>
                </div>

                {/* Aesthetic background glow lights */}
                <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
                    <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-fuchsia-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
                </div>

                {/* Primary Chat Box Wrapper */}
                <div className="flex-1 flex flex-col items-center justify-between p-6 z-10 w-full max-w-3xl mx-auto h-full relative">
                    <motion.div 
                        layout
                        className={cn(
                            "relative z-10 w-full flex flex-col h-full",
                            messages.length > 0 ? "justify-end pb-4" : "justify-center space-y-6"
                        )}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        {/* Splash Header (Only when no messages) */}
                        <AnimatePresence>
                            {messages.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 1, height: "auto", scale: 1 }}
                                    exit={{ opacity: 0, height: 0, scale: 0.95, overflow: "hidden", marginBottom: 0 }}
                                    transition={{ duration: 0.4, ease: "easeInOut" }}
                                    className="text-center space-y-2 shrink-0 mb-4"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="inline-block"
                                    >
                                        <h1 className="text-3xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/95 to-white/50 pb-1">
                                            How can I help today?
                                        </h1>
                                        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-full" />
                                    </motion.div>
                                    <p className="text-xs text-white/40">
                                        Type a command or ask a question
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Scrollable Chat Message History (No borders, transparent container) */}
                        {messages.length > 0 && (
                            <div className="flex-1 w-full overflow-y-auto space-y-5 py-4 pr-1.5 no-scrollbar max-h-[78vh]">
                                {messages.map((msg) => (
                                    <div key={msg.id} className="flex flex-col w-full">
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className={cn(
                                                "w-full flex",
                                                msg.role === 'user' ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            <div className={cn(
                                                "text-sm leading-relaxed",
                                                msg.role === 'user'
                                                    ? "max-w-[85%] px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600/15 to-indigo-600/15 border border-violet-500/25 text-white/90 rounded-br-sm shadow-sm"
                                                    : "max-w-full bg-transparent border-none text-white/95 py-1 px-0 shadow-none w-full"
                                            )}>
                                                <ReactMarkdown 
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                         a: ({ node, href, children, ...props }) => {
                                                             let displayName = children;
                                                             if (typeof children === 'string') {
                                                                 const isUrl = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i.test(children);
                                                                 if (isUrl) {
                                                                     displayName = getCleanSiteName(children);
                                                                 }
                                                             }
                                                             return (
                                                                 <a 
                                                                     className="text-violet-400 hover:underline inline-flex items-center gap-0.5 font-medium" 
                                                                     target="_blank" 
                                                                     rel="noopener noreferrer" 
                                                                     href={href}
                                                                     {...props}
                                                                 >
                                                                     {displayName}
                                                                     <span className="text-[10px] opacity-70 ml-0.5">↗</span>
                                                                 </a>
                                                             );
                                                         },
                                                         p: ({ node, ...props }) => <p className="mb-4 last:mb-0 leading-[1.7] text-[15px] text-white/90 font-sans font-normal tracking-wide" {...props} />,
                                                         h1: ({ node, ...props }) => <h1 className="text-2xl font-semibold font-serif text-white mt-6 mb-3 first:mt-0 leading-tight" {...props} />,
                                                         h2: ({ node, ...props }) => <h2 className="text-xl font-semibold font-serif text-white/95 mt-5 mb-2.5 first:mt-0 leading-tight" {...props} />,
                                                         h3: ({ node, ...props }) => <h3 className="text-lg font-medium font-serif text-white/90 mt-4 mb-2 first:mt-0 leading-tight" {...props} />,
                                                         ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2 text-white/80" {...props} />,
                                                         ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-white/80" {...props} />,
                                                         li: ({ node, ...props }) => <li className="text-[15px] leading-[1.7] text-white/85 font-sans" {...props} />,
                                                         strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
                                                         table: ({ node, ...props }) => (
                                                             <div className="overflow-x-auto my-3 rounded-lg border border-white/10 bg-white/[0.01]">
                                                                 <table className="min-w-full divide-y divide-white/10 text-xs text-left" {...props} />
                                                             </div>
                                                         ),
                                                         thead: ({ node, ...props }) => <thead className="bg-white/[0.03]" {...props} />,
                                                         tbody: ({ node, ...props }) => <tbody className="divide-y divide-white/[0.05]" {...props} />,
                                                         tr: ({ node, ...props }) => <tr className="hover:bg-white/[0.01] transition-colors" {...props} />,
                                                         th: ({ node, ...props }) => <th className="px-3 py-1.5 font-medium text-white/50 border-r border-white/10 last:border-r-0" {...props} />,
                                                         td: ({ node, ...props }) => <td className="px-3 py-1.5 text-white/80 border-r border-white/[0.05] last:border-r-0 align-top" {...props} />,
                                                         code: ({ node, className, children, ...props }) => {
                                                             const match = /language-(\w+)/.exec(className || '');
                                                             return match ? (
                                                                 <pre className="bg-black/50 border border-white/10 p-3 rounded-lg overflow-x-auto my-2 text-xs font-mono">
                                                                     <code className="text-violet-300" {...props}>{children}</code>
                                                                 </pre>
                                                             ) : (
                                                                 <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-violet-300" {...props}>{children}</code>
                                                             );
                                                         }
                                                     }}
                                                 >
                                                     {preprocessMarkdown(msg.content)}
                                                 </ReactMarkdown>
                                            </div>
                                        </motion.div>

                                        {msg.role === 'assistant' && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                                className="flex items-center gap-2 mt-1.5 text-white/35 shrink-0"
                                            >
                                                <button
                                                    onClick={() => handleCopy(msg.content, msg.id)}
                                                    className="p-1 hover:bg-white/[0.05] rounded hover:text-white transition-colors"
                                                    title="Copy response"
                                                >
                                                    {copiedId === msg.id ? (
                                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                    ) : (
                                                        <Copy className="w-3.5 h-3.5" />
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => handleRate(msg.id, 'like')}
                                                    className={cn(
                                                        "p-1 hover:bg-white/[0.05] rounded hover:text-white transition-colors",
                                                        ratings[msg.id] === 'like' && "text-emerald-400 hover:text-emerald-300"
                                                    )}
                                                    title="Good response"
                                                >
                                                    <ThumbsUp className="w-3.5 h-3.5" />
                                                </button>

                                                <button
                                                    onClick={() => handleRate(msg.id, 'dislike')}
                                                    className={cn(
                                                        "p-1 hover:bg-white/[0.05] rounded hover:text-white transition-colors",
                                                        ratings[msg.id] === 'dislike' && "text-rose-400 hover:text-rose-300"
                                                    )}
                                                    title="Bad response"
                                                >
                                                    <ThumbsDown className="w-3.5 h-3.5" />
                                                </button>

                                                <button
                                                    onClick={() => handleRegenerate(msg.id)}
                                                    className="p-1 hover:bg-white/[0.05] rounded hover:text-white transition-colors"
                                                    title="Regenerate response"
                                                >
                                                    <RotateCw className="w-3.5 h-3.5" />
                                                </button>
                                            </motion.div>
                                        )}
                                    </div>
                                ))}
                                <AnimatePresence>
                                    {isTyping && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.25 }}
                                            className="flex flex-col w-full"
                                        >
                                            <div className="flex gap-3 max-w-[85%] items-start mr-auto">
                                                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border text-[10px] font-semibold bg-white/[0.05] border-white/10 text-white/60">
                                                    <span>SBB</span>
                                                </div>
                                                <motion.div
                                                    animate={{
                                                        borderColor: [
                                                            "rgba(139, 92, 246, 0.2)",
                                                            "rgba(236, 72, 153, 0.2)",
                                                            "rgba(139, 92, 246, 0.2)"
                                                        ],
                                                        boxShadow: [
                                                            "0 0 10px rgba(139, 92, 246, 0.05)",
                                                            "0 0 20px rgba(236, 72, 153, 0.1)",
                                                            "0 0 10px rgba(139, 92, 246, 0.05)"
                                                        ]
                                                    }}
                                                    transition={{
                                                        duration: 3,
                                                        repeat: Infinity,
                                                        ease: "easeInOut"
                                                    }}
                                                    className="px-5 py-3.5 rounded-2xl text-sm bg-white/[0.02] backdrop-blur-md border text-white/95 rounded-tl-sm shadow-sm flex items-center gap-4"
                                                >
                                                    <span className="text-white/60 text-xs tracking-wider font-medium uppercase">Thinking</span>
                                                    <TypingDots />
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div ref={messagesEndRef} />
                            </div>
                        )}

                        {/* Chat Input Container */}
                        <motion.div layout className="shrink-0 w-full mt-2">
                            <motion.div 
                                className="relative backdrop-blur-2xl bg-white/[0.02] rounded-2xl border border-white/[0.05] shadow-2xl"
                                initial={{ scale: 0.98 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                <AnimatePresence>
                                    {showCommandPalette && (
                                        <motion.div 
                                            ref={commandPaletteRef}
                                            className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-black/90 rounded-lg z-50 shadow-lg border border-white/10 overflow-hidden"
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 5 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            <div className="py-1 bg-black/95">
                                                {commandSuggestions.map((suggestion, index) => (
                                                    <motion.div
                                                        key={suggestion.prefix}
                                                        className={cn(
                                                            "flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer",
                                                            activeSuggestion === index 
                                                                ? "bg-white/10 text-white" 
                                                                : "text-white/70 hover:bg-white/5"
                                                        )}
                                                        onClick={() => selectCommandSuggestion(index)}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: index * 0.03 }}
                                                    >
                                                        <div className="w-5 h-5 flex items-center justify-center text-white/60">
                                                            {suggestion.icon}
                                                        </div>
                                                        <div className="font-medium">{suggestion.label}</div>
                                                        <div className="text-white/40 text-xs ml-1">
                                                            {suggestion.prefix}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="p-3">
                                    <Textarea
                                        ref={textareaRef}
                                        value={value}
                                        onChange={(e) => {
                                            setValue(e.target.value);
                                            adjustHeight();
                                        }}
                                        onKeyDown={handleKeyDown}
                                        onFocus={() => setInputFocused(true)}
                                        onBlur={() => setInputFocused(false)}
                                        placeholder="Ask SB Brain a question..."
                                        containerClassName="w-full"
                                        className={cn(
                                            "w-full px-4 py-2",
                                            "resize-none",
                                            "bg-transparent",
                                            "border-none",
                                            "text-white/90 text-sm",
                                            "focus:outline-none",
                                            "placeholder:text-white/20",
                                            "min-h-[36px]",
                                            "custom-scrollbar"
                                        )}
                                        showRing={false}
                                    />
                                </div>

                                <AnimatePresence>
                                    {attachments.length > 0 && (
                                        <motion.div 
                                            className="px-4 pb-3 flex gap-2 flex-wrap"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            {attachments.map((file, index) => (
                                                <motion.div
                                                    key={index}
                                                    className="flex items-center gap-2 text-xs bg-white/[0.03] py-1.5 px-3 rounded-lg text-white/70"
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                >
                                                    <span>{file}</span>
                                                    <button 
                                                        onClick={() => removeAttachment(index)}
                                                        className="text-white/40 hover:text-white transition-colors"
                                                    >
                                                        <XIcon className="w-3 h-3" />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="p-3 border-t border-white/[0.04] flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <motion.button
                                            type="button"
                                            data-command-button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowCommandPalette(prev => !prev);
                                            }}
                                            whileTap={{ scale: 0.94 }}
                                            className={cn(
                                                "p-2 text-white/40 hover:text-white/90 rounded-lg transition-colors relative group",
                                                showCommandPalette && "bg-white/10 text-white/90"
                                            )}
                                        >
                                            <Command className="w-4 h-4" />
                                            <motion.span
                                                className="absolute inset-0 bg-white/[0.05] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                layoutId="button-highlight"
                                            />
                                        </motion.button>
                                    </div>
                                    
                                    <motion.button
                                        type="button"
                                        onClick={handleSendMessage}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={isTyping || !value.trim()}
                                        className={cn(
                                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                            "flex items-center gap-2",
                                            value.trim()
                                                ? "bg-white text-[#0A0A0B] shadow-lg shadow-white/10"
                                                : "bg-white/[0.05] text-white/40"
                                        )}
                                    >
                                        {isTyping ? (
                                            <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite]" />
                                        ) : (
                                            <SendIcon className="w-4 h-4" />
                                        )}
                                        <span>Send</span>
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Suggestions */}
                        <AnimatePresence>
                            {messages.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 1, height: "auto", scale: 1 }}
                                    exit={{ opacity: 0, height: 0, scale: 0.95, overflow: "hidden", marginTop: 0 }}
                                    transition={{ duration: 0.4, ease: "easeInOut" }}
                                    className="flex flex-wrap items-center justify-center gap-2 mt-4 shrink-0"
                                >
                                    {commandSuggestions.map((suggestion, index) => (
                                        <motion.button
                                            key={suggestion.prefix}
                                            onClick={() => selectCommandSuggestion(index)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] hover:bg-white/[0.05] rounded-lg text-xs text-white/60 hover:text-white/90 transition-all relative group"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            {suggestion.icon}
                                            <span>{suggestion.label}</span>
                                            <motion.div
                                                className="absolute inset-0 border border-white/[0.05] rounded-lg"
                                                initial={false}
                                                animate={{
                                                    opacity: [0, 1],
                                                    scale: [0.98, 1],
                                                }}
                                                transition={{
                                                    duration: 0.3,
                                                    ease: "easeOut",
                                                }}
                                            />
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>



            {/* Mouse movement gradient glow following cursor */}
            {inputFocused && (
                <motion.div 
                    className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-[0.015] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 blur-[96px]"
                    animate={{
                        x: mousePosition.x - 400,
                        y: mousePosition.y - 400,
                    }}
                    transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 150,
                        mass: 0.5,
                    }}
                />
            )}
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

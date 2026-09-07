import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Search,
  MessageSquare,
  Users,
  Sparkles,
  Bot,
  User,
  ExternalLink,
  ChevronLeft,
  Paperclip,
  CheckCircle2,
  Phone,
  Mail,
  Building,
  ShieldCheck,
  Plus
} from 'lucide-react';

interface GoogleChatMessage {
  id: string;
  spaceId: string;
  senderName: string;
  senderEmail: string;
  isNoraBot?: boolean;
  text: string;
  timestamp: string;
  attachments?: { name: string; url: string; type: string }[];
}

interface GoogleChatSpace {
  id: string;
  name: string;
  type: 'dm' | 'space';
  memberCount: number;
  members: { name: string; email: string; role?: string; avatar?: string }[];
  lastMessage?: GoogleChatMessage;
  unreadCount: number;
  updatedAt: string;
  isNoraAssistant?: boolean;
}

interface DirectoryPerson {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  title: string;
  primaryOfficeName: string;
  officeNames: string[];
  isBrokerInCharge: boolean;
}

interface GoogleChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserName?: string;
  currentUserEmail?: string;
}

export const GoogleChatDrawer: React.FC<GoogleChatDrawerProps> = ({
  isOpen,
  onClose,
  currentUserName = 'Ryan Crecelius',
  currentUserEmail = 'ryan@nestrealty.com'
}) => {
  const [activeTab, setActiveTab] = useState<'conversations' | 'directory'>('conversations');
  const [spaces, setSpaces] = useState<GoogleChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<GoogleChatSpace | null>(null);
  const [messages, setMessages] = useState<GoogleChatMessage[]>([]);
  const [roster, setRoster] = useState<DirectoryPerson[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch active spaces & roster
  useEffect(() => {
    if (isOpen) {
      fetchSpaces();
      fetchRoster();
    }
  }, [isOpen]);

  // Fetch messages when space is selected
  useEffect(() => {
    if (selectedSpace) {
      fetchMessages(selectedSpace.id);
      const interval = setInterval(() => {
        fetchMessages(selectedSpace.id);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [selectedSpace]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSpaces = async () => {
    try {
      const res = await fetch('/api/google-chat/spaces');
      const data = await res.json();
      if (data.success) setSpaces(data.spaces || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRoster = async () => {
    try {
      const res = await fetch('/api/google-chat/roster');
      const data = await res.json();
      if (data.success) setRoster(data.roster || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (spaceId: string) => {
    try {
      const res = await fetch(`/api/google-chat/messages/${spaceId}`);
      const data = await res.json();
      if (data.success) setMessages(data.messages || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartChatWithBroker = async (person: DirectoryPerson) => {
    try {
      const res = await fetch('/api/google-chat/create-dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: person.email,
          currentUserName,
          currentUserEmail
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedSpace(data.space);
        setActiveTab('conversations');
        fetchSpaces();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartChatWithNora = async () => {
    try {
      const res = await fetch('/api/google-chat/create-dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: 'AskNora@nestrealty.com',
          currentUserName,
          currentUserEmail
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedSpace(data.space);
        setActiveTab('conversations');
        fetchSpaces();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !selectedSpace || isSending) return;

    const textToSend = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    // Optimistically append user message
    const tempUserMsg: GoogleChatMessage = {
      id: `temp_${Date.now()}`,
      spaceId: selectedSpace.id,
      senderName: currentUserName,
      senderEmail: currentUserEmail,
      text: textToSend,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/google-chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceId: selectedSpace.id,
          senderName: currentUserName,
          senderEmail: currentUserEmail,
          text: textToSend
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchMessages(selectedSpace.id);
        fetchSpaces();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const filteredRoster = roster.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.displayName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.role.toLowerCase().includes(q) ||
      p.primaryOfficeName?.toLowerCase().includes(q) ||
      p.phone?.includes(q)
    );
  });

  const filteredSpaces = spaces.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.lastMessage?.text?.toLowerCase().includes(q);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Glassmorphism Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/30 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg md:max-w-xl bg-[#FAF9F6] border-l border-stone-200/90 shadow-2xl flex flex-col justify-between">
          {/* Top Drawer Header (Apple Light Mode) */}
          <div className="bg-white px-5 py-4 border-b border-stone-200/80 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              {selectedSpace ? (
                <button
                  onClick={() => setSelectedSpace(null)}
                  className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition"
                  title="Back to Conversations"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00635C] border border-emerald-200 flex items-center justify-center shadow-2xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-stone-900">
                    {selectedSpace ? selectedSpace.name : 'Google Chat • Nest Workspace'}
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[10px] text-stone-500">
                  {selectedSpace
                    ? selectedSpace.type === 'space'
                      ? `${selectedSpace.memberCount} Members • Google Space`
                      : `${selectedSpace.members[0]?.role || 'Direct Message'} • Online`
                    : '77 Brokers Active in Google Workspace Directory'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Section */}
          {!selectedSpace ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Tab Switcher & Search Bar */}
              <div className="p-4 bg-white/60 border-b border-stone-200/70 space-y-3">
                <div className="flex items-center p-1 bg-stone-100/90 rounded-xl border border-stone-200/80">
                  <button
                    onClick={() => setActiveTab('conversations')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeTab === 'conversations'
                        ? 'bg-white text-[#01362D] shadow-xs border border-stone-200/80'
                        : 'text-stone-600 hover:text-[#01362D]'
                    }`}
                  >
                    💬 Conversations ({spaces.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('directory')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeTab === 'directory'
                        ? 'bg-white text-[#01362D] shadow-xs border border-stone-200/80'
                        : 'text-stone-600 hover:text-[#01362D]'
                    }`}
                  >
                    👥 Team Directory ({roster.length})
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-600" />
                  <input
                    type="text"
                    placeholder={
                      activeTab === 'conversations'
                        ? 'Search conversations or spaces...'
                        : 'Search 77 brokers by name, office, or role...'
                    }
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                  />
                </div>
              </div>

              {/* 1. Conversations List */}
              {activeTab === 'conversations' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {/* Quick Action: Chat with Nora AI */}
                  <div
                    onClick={handleStartChatWithNora}
                    className="bg-gradient-to-r from-emerald-50 via-white to-stone-50 p-3 rounded-xl border border-emerald-200 hover:border-emerald-300 cursor-pointer shadow-xs transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#00635C] text-white flex items-center justify-center shadow-xs">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-stone-900">Nora AI Assistant</span>
                          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
                            24/7 AI Bot
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 line-clamp-1">
                          Ask for offer drafts, 3-day trust checks, net sheets, or market comps.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#00635C] font-semibold group-hover:underline">
                      Chat →
                    </span>
                  </div>

                  {filteredSpaces.map(space => (
                    <div
                      key={space.id}
                      onClick={() => setSelectedSpace(space)}
                      className="bg-white p-3 rounded-xl border border-stone-200/80 hover:border-[#00635C] cursor-pointer shadow-2xs hover:shadow-xs transition-all flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                          space.isNoraAssistant
                            ? 'bg-[#00635C] text-white'
                            : space.type === 'space'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-stone-100 text-stone-800'
                        }`}>
                          {space.isNoraAssistant ? <Bot className="w-4 h-4" /> : space.type === 'space' ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-stone-900">{space.name}</h4>
                            {space.type === 'space' && (
                              <span className="text-[9px] text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                                {space.memberCount} members
                              </span>
                            )}
                          </div>
                          {space.lastMessage && (
                            <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                              <span className="font-semibold text-stone-700">{space.lastMessage.senderName}: </span>
                              {space.lastMessage.text}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-stone-600 block">
                          {space.lastMessage ? new Date(space.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        {space.unreadCount > 0 && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold bg-[#00635C] text-white rounded-full">
                            {space.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 2. Team Roster Directory (77 Brokers) */}
              {activeTab === 'directory' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {filteredRoster.map(person => (
                    <div
                      key={person.id}
                      className="bg-white p-3 rounded-xl border border-stone-200/80 hover:border-stone-300 shadow-2xs transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-xs">
                          {person.firstName[0]}{person.lastName[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-stone-900">{person.displayName}</span>
                            {person.isBrokerInCharge && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-100 text-amber-800 rounded">
                                BIC
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-stone-500">{person.email}</p>
                          <div className="flex items-center gap-2 text-[9px] text-stone-600 mt-0.5">
                            <span>📍 {person.primaryOfficeName || 'Wilmington'}</span>
                            <span>•</span>
                            <span>{person.phone}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartChatWithBroker(person)}
                        className="px-3 py-1.5 bg-[#00635C] hover:bg-[#00524C] text-white text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Chat</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Active Chat View */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Message History Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => {
                  const isMe = msg.senderEmail.toLowerCase() === currentUserEmail.toLowerCase();
                  const isNora = msg.isNoraBot || msg.senderEmail.toLowerCase().includes('nora');

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-bold text-stone-700">
                          {isMe ? 'You' : msg.senderName}
                        </span>
                        {isNora && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> Nora AI
                          </span>
                        )}
                        <span className="text-[9px] text-stone-600">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-[#00635C] text-white rounded-br-xs shadow-xs'
                            : isNora
                              ? 'bg-gradient-to-br from-emerald-50 to-white text-stone-900 border border-emerald-200/80 rounded-bl-xs shadow-xs'
                              : 'bg-white text-stone-900 border border-stone-200/90 rounded-bl-xs shadow-2xs'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick AI Suggestions Pills */}
              <div className="px-4 py-2 bg-stone-50/80 border-t border-stone-200/60 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="text-[10px] font-bold text-stone-600 shrink-0">Ask Nora:</span>
                {[
                  '@Nora what are the 3-day deposit rules?',
                  '@Nora calculate seller net sheet for $725k',
                  '@Nora pull Cape Fear MLS stats'
                ].map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => {
                      setMessageInput(prompt);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-stone-700 hover:text-[#00635C] border border-stone-200 rounded-full text-[10px] font-medium whitespace-nowrap transition cursor-pointer shadow-2xs"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Message Input Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 bg-white border-t border-stone-200/80 flex items-center gap-2 shadow-sm"
              >
                <input
                  type="text"
                  placeholder="Type a message or tag @Nora for AI assistance..."
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || isSending}
                  className="p-2 bg-[#00635C] hover:bg-[#00524C] text-white rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

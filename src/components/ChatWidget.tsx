import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import {
  MessageCircle, Search, Send, X, ChevronDown, ChevronUp,
  Circle, Trash2, UserCircle, Plus, Paperclip, FileText,
  Download, Loader2
} from 'lucide-react';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  role?: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
}

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  partnerRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const ChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data
  useEffect(() => {
    if (user?.id) {
      fetchProfiles();
      fetchMessages();
    }
  }, [user]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedPartner]);

  // Focus input
  useEffect(() => {
    if (selectedPartner && isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [selectedPartner, isOpen]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role')
        .eq('role', 'alumni')
        .eq('status', 'verified')
        .order('last_name', { ascending: true });
      if (!error) setProfiles(data || []);
    } catch (err) {
      console.error('ChatWidget: fetchProfiles error', err);
    }
  };

  const fetchMessages = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });
      if (error) {
        console.error('ChatWidget: fetchMessages error', error);
        return;
      }
      if (data) setMessages(data.map(m => ({
        ...m,
        read: m.is_read,
        attachment_url: m.attachment_url || undefined,
        attachment_name: m.attachment_name || undefined,
        attachment_type: m.attachment_type || undefined,
      })));
    } catch (err) {
      console.error('ChatWidget: fetchMessages exception', err);
    }
  };

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('chat-widget-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as any;
        if (newMsg.sender_id === user.id || newMsg.receiver_id === user.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, read: newMsg.is_read }];
          });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const updated = payload.new as any;
        setMessages(prev => prev.map(m => m.id === updated.id ? { ...updated, read: updated.is_read } : m));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
        const deleted = payload.old as any;
        setMessages(prev => prev.filter(m => m.id !== deleted.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { return; }
    setSelectedFile(file);
  };

  const uploadFile = async (file: File): Promise<{ url: string; name: string; type: string } | null> => {
    try {
      const ext = file.name.split('.').pop();
      const path = `${user?.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('message-attachments').upload(path, file);
      if (error) { console.error('Upload error:', error); return null; }
      const { data: urlData } = supabase.storage.from('message-attachments').getPublicUrl(path);
      return { url: urlData.publicUrl, name: file.name, type: file.type.startsWith('image/') ? 'image' : 'file' };
    } catch (err) { console.error('Upload exception:', err); return null; }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedPartner || !user?.id) return;
    const content = newMessage.trim();
    setNewMessage('');

    let attachment: { url: string; name: string; type: string } | null = null;
    if (selectedFile) {
      setUploading(true);
      attachment = await uploadFile(selectedFile);
      setUploading(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }

    try {
      const insertData: any = {
        sender_id: user.id,
        receiver_id: selectedPartner,
        content: content || (attachment ? attachment.name : ''),
        is_read: false,
      };
      if (attachment) {
        insertData.attachment_url = attachment.url;
        insertData.attachment_name = attachment.name;
        insertData.attachment_type = attachment.type;
      }
      const { error } = await supabase.from('messages').insert(insertData);
      if (error) {
        console.error('Send message error:', error);
        setNewMessage(content);
      }
    } catch (err) {
      console.error('Send message exception:', err);
      setNewMessage(content);
    }
    inputRef.current?.focus();
  };

  const deleteConversation = async (partnerId: string) => {
    if (!confirm('Delete this conversation?')) return;
    const idsToDelete = messages
      .filter(m =>
        (m.sender_id === user?.id && m.receiver_id === partnerId) ||
        (m.sender_id === partnerId && m.receiver_id === user?.id)
      )
      .map(m => m.id);
    if (idsToDelete.length > 0) {
      await supabase.from('messages').delete().in('id', idsToDelete);
    }
    setMessages(prev => prev.filter(m => !idsToDelete.includes(m.id)));
    if (selectedPartner === partnerId) setSelectedPartner(null);
  };

  const getProfile = (id: string): Profile | undefined => profiles.find(p => p.id === id);

  // Mark as read
  useEffect(() => {
    if (!selectedPartner || !user?.id) return;
    const unreadIds = messages
      .filter(m => m.sender_id === selectedPartner && m.receiver_id === user.id && !m.read)
      .map(m => m.id);
    if (unreadIds.length > 0) {
      supabase.from('messages').update({ is_read: true }).in('id', unreadIds).then(() => {
        setMessages(prev => prev.map(m => unreadIds.includes(m.id) ? { ...m, read: true } : m));
      });
    }
  }, [selectedPartner]);

  // Build conversations
  const conversations = useMemo((): Conversation[] => {
    const convMap: Record<string, { msgs: Message[]; unread: number }> = {};
    messages.forEach(m => {
      const partnerId = m.sender_id === user?.id ? m.receiver_id : m.sender_id;
      if (!convMap[partnerId]) convMap[partnerId] = { msgs: [], unread: 0 };
      convMap[partnerId].msgs.push(m);
      if (m.sender_id !== user?.id && !m.read) convMap[partnerId].unread++;
    });
    return Object.entries(convMap)
      .map(([partnerId, data]) => {
        const profile = getProfile(partnerId);
        const lastMsg = data.msgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        return {
          partnerId,
          partnerName: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown User',
          partnerAvatar: profile?.avatar_url || '',
          partnerRole: profile?.role || 'alumni',
          lastMessage: lastMsg.content,
          lastMessageTime: lastMsg.created_at,
          unreadCount: data.unread,
        };
      })
      .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
  }, [messages, profiles, user]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const filteredConversations = conversations.filter(c =>
    c.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const conversationMessages = useMemo(() => {
    if (!selectedPartner) return [];
    return messages
      .filter(m =>
        (m.sender_id === user?.id && m.receiver_id === selectedPartner) ||
        (m.sender_id === selectedPartner && m.receiver_id === user?.id)
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [messages, selectedPartner, user]);

  const filteredContacts = profiles.filter(p => {
    if (p.id === user?.id) return false;
    return `${p.first_name} ${p.last_name}`.toLowerCase().includes(contactSearch.toLowerCase());
  });

  const selectedProfile = selectedPartner ? getProfile(selectedPartner) : null;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Chat Bar (LinkedIn-style bottom-right) */}
      <div className="fixed bottom-0 right-6 z-[90]" style={{ width: '338px' }}>
        {/* Header Bar - Always visible */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 border-b-0 rounded-t-xl shadow-lg hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <MessageCircle className="w-4.5 h-4.5 text-blue-600" />
              {totalUnread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </div>
            <span className="text-sm font-bold text-slate-800">Messaging</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              onClick={(e) => { e.stopPropagation(); setIsOpen(true); setShowNewChat(true); }}
              className="p-1 hover:bg-slate-200 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4 text-slate-500" />
            </div>
            {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        {/* Chat Panel */}
        {isOpen && (
          <div className="bg-white border border-slate-200 border-t-0 shadow-2xl flex flex-col" style={{ height: '420px' }}>
            {selectedPartner && selectedProfile ? (
              /* ============ ACTIVE CHAT VIEW ============ */
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-2.5 px-3 py-2 border-b border-slate-100 bg-slate-50/50">
                  <button
                    onClick={() => setSelectedPartner(null)}
                    className="p-1 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    <ChevronDown className="w-4 h-4 text-slate-500 rotate-90" />
                  </button>
                  <img
                    src={selectedProfile.avatar_url || `https://ui-avatars.com/api/?name=${selectedProfile.first_name}+${selectedProfile.last_name}&background=random&size=32`}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    alt=""
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{selectedProfile.first_name} {selectedProfile.last_name}</p>
                    <div className="flex items-center gap-1">
                      <Circle className="w-1.5 h-1.5 fill-green-500 text-green-500" />
                      <span className="text-[10px] text-slate-400">Alumni</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteConversation(selectedPartner)}
                    className="p-1 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 bg-white">
                  {conversationMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <UserCircle className="w-10 h-10 text-slate-200 mb-2" />
                      <p className="text-xs font-bold text-slate-400">Start your conversation</p>
                      <p className="text-[10px] text-slate-300 mt-0.5">Say hello to {selectedProfile.first_name}!</p>
                    </div>
                  ) : (
                    conversationMessages.map(msg => {
                      const isMine = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                            isMine
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-slate-100 text-slate-700 rounded-bl-sm'
                          }`}>
                            {msg.attachment_url && msg.attachment_type === 'image' && (
                              <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="block mb-1">
                                <img src={msg.attachment_url} alt={msg.attachment_name || 'image'} className="max-w-full max-h-40 rounded-lg object-cover" />
                              </a>
                            )}
                            {msg.attachment_url && msg.attachment_type === 'file' && (
                              <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 mb-1 px-2 py-1.5 rounded-lg text-[10px] font-bold ${isMine ? 'bg-blue-500/30 text-white hover:bg-blue-500/50' : 'bg-white text-blue-600 hover:bg-blue-50 border border-slate-200'}`}>
                                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{msg.attachment_name || 'File'}</span>
                                <Download className="w-3 h-3 flex-shrink-0" />
                              </a>
                            )}
                            {msg.content && !msg.content.startsWith('📎') && (
                              <p className="text-xs leading-relaxed break-words">{msg.content}</p>
                            )}
                            {msg.content && msg.content.startsWith('📎') && !msg.attachment_url && (
                              <p className="text-xs leading-relaxed break-words">{msg.content}</p>
                            )}
                            <p className={`text-[9px] mt-0.5 ${isMine ? 'text-blue-200' : 'text-slate-400'}`}>
                              {formatMessageTime(msg.created_at)}
                              {isMine && <span className="ml-1">{msg.read ? '✓✓' : '✓'}</span>}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* File Preview */}
                {selectedFile && (
                  <div className="px-3 py-1.5 border-t border-slate-100 bg-blue-50 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-[10px] font-bold text-blue-700 truncate flex-1">{selectedFile.name}</span>
                    <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="p-0.5 hover:bg-blue-100 rounded">
                      <X className="w-3 h-3 text-blue-400" />
                    </button>
                  </div>
                )}

                {/* Input */}
                <div className="px-3 py-2 border-t border-slate-100">
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" />
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors"
                      title="Attach file"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      placeholder="Write a message..."
                      className="flex-1 px-3 py-2 bg-slate-50 rounded-full text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-blue-200 border border-slate-200"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() && !selectedFile}
                      className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* ============ CONVERSATION LIST VIEW ============ */
              <>
                {/* Search */}
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search messages"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-blue-200 border border-slate-100"
                    />
                  </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                      <MessageCircle className="w-8 h-8 text-slate-200 mb-2" />
                      <p className="text-xs font-bold text-slate-400">No conversations yet</p>
                      <button
                        onClick={() => setShowNewChat(true)}
                        className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-colors"
                      >
                        Start a Chat
                      </button>
                    </div>
                  ) : (
                    filteredConversations.map(conv => (
                      <div
                        key={conv.partnerId}
                        onClick={() => setSelectedPartner(conv.partnerId)}
                        className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-all border-b border-slate-50 group"
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={conv.partnerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.partnerName)}&background=random&size=36`}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            alt=""
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>{conv.partnerName}</p>
                            <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">{formatTime(conv.lastMessageTime)}</span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className={`text-[11px] truncate ${conv.unreadCount > 0 ? 'font-semibold text-slate-600' : 'text-slate-400'}`}>{conv.lastMessage}</p>
                            {conv.unreadCount > 0 && (
                              <span className="ml-1 flex-shrink-0 w-4 h-4 bg-blue-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); deleteConversation(conv.partnerId); }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setShowNewChat(false)}>
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800">New Message</h3>
              <button onClick={() => setShowNewChat(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                  placeholder="Search alumni or admin..."
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-blue-200"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-[280px] overflow-y-auto px-2 pb-3">
              {filteredContacts.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">No contacts found</p>
              ) : (
                filteredContacts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPartner(p.id); setShowNewChat(false); setContactSearch(''); setIsOpen(true); }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-slate-50 transition-all text-left"
                  >
                    <div className="relative">
                      <img
                        src={p.avatar_url || `https://ui-avatars.com/api/?name=${p.first_name}+${p.last_name}&background=random&size=32`}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        alt=""
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{p.first_name} {p.last_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold">Alumni</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;

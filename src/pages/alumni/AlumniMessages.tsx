import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  MessageCircle, Search, Send, X, Loader2,
  ChevronLeft, Circle, Trash2, UserCircle, Paperclip, FileText, Download
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

const AlumniMessages = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Load profiles and messages
  useEffect(() => {
    if (user?.id) {
      fetchProfiles();
      fetchMessages();
    }
  }, [user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedPartner]);

  // Focus input when partner selected
  useEffect(() => {
    if (selectedPartner) inputRef.current?.focus();
  }, [selectedPartner]);

  const fetchProfiles = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role')
        .eq('role', 'alumni')
        .eq('status', 'verified')
        .order('last_name', { ascending: true });
      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: true });
    if (!error && data) setMessages(data.map(m => ({
      ...m,
      read: m.is_read,
      attachment_url: m.attachment_url || undefined,
      attachment_name: m.attachment_name || undefined,
      attachment_type: m.attachment_type || undefined,
    })));
  };

  // Realtime subscription for live messages
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const newMsg = payload.new as any;
        if (newMsg.sender_id === user.id || newMsg.receiver_id === user.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, read: newMsg.is_read }];
          });
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const updated = payload.new as any;
        setMessages(prev => prev.map(m => m.id === updated.id ? { ...updated, read: updated.is_read } : m));
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const deleted = payload.old as any;
        setMessages(prev => prev.filter(m => m.id !== deleted.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast({ title: 'Error', message: 'File size must be under 10MB', type: 'error' }); return; }
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
        showToast({ title: 'Error', message: 'Failed to send message. ' + (error.message || ''), type: 'error' });
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
    showToast({ title: 'Deleted', message: 'Conversation removed.', type: 'info' });
  };

  const getProfile = (id: string): Profile | undefined => profiles.find(p => p.id === id);

  // Build conversation list
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

  const filteredConversations = conversations.filter(c =>
    c.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Messages for selected conversation
  const conversationMessages = useMemo(() => {
    if (!selectedPartner) return [];
    return messages
      .filter(m =>
        (m.sender_id === user?.id && m.receiver_id === selectedPartner) ||
        (m.sender_id === selectedPartner && m.receiver_id === user?.id)
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [messages, selectedPartner, user]);

  // Mark messages as read when viewing
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

  const startNewChat = (profileId: string) => {
    setSelectedPartner(profileId);
    setShowNewChat(false);
    setContactSearch('');
  };

  const filteredContacts = profiles.filter(p => {
    if (p.id === user?.id) return false;
    const name = `${p.first_name} ${p.last_name}`.toLowerCase();
    return name.includes(contactSearch.toLowerCase());
  });

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    conversationMessages.forEach(m => {
      const date = new Date(m.created_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ date, messages: [m] });
      } else {
        groups[groups.length - 1].messages.push(m);
      }
    });
    return groups;
  }, [conversationMessages]);

  const selectedProfile = selectedPartner ? getProfile(selectedPartner) : null;

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-700 pb-4">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
          <MessageCircle className="w-3.5 h-3.5" /> Messages
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Messaging</h1>
        <p className="text-slate-400 text-sm mt-1">Chat with fellow alumni and admins.</p>
      </div>

      {/* Main chat area */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 240px)', minHeight: '500px' }}>
        <div className="flex h-full">

          {/* Sidebar - Conversation List */}
          <div className={`${selectedPartner ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[340px] border-r border-slate-100`}>
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-black text-slate-800">Chats</h2>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  title="New message"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <MessageCircle className="w-12 h-12 text-slate-200 mb-3" />
                  <p className="text-sm font-bold text-slate-400">No conversations yet</p>
                  <p className="text-xs text-slate-300 mt-1">Start a new chat with a fellow alumni or admin.</p>
                  <button
                    onClick={() => setShowNewChat(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                  >
                    Start a Conversation
                  </button>
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <div
                    key={conv.partnerId}
                    onClick={() => setSelectedPartner(conv.partnerId)}
                    className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all border-b border-slate-50 group ${
                      selectedPartner === conv.partnerId ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={conv.partnerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.partnerName)}&background=random&size=48`}
                        className="w-11 h-11 rounded-full object-cover border-2 border-slate-100"
                        alt=""
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-800 truncate">{conv.partnerName}</p>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">{formatTime(conv.lastMessageTime)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-slate-400 truncate">{conv.lastMessage}</p>
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteConversation(conv.partnerId); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`${selectedPartner ? 'flex' : 'hidden md:flex'} flex-col flex-1`}>
            {selectedPartner && selectedProfile ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-white">
                  <button
                    onClick={() => setSelectedPartner(null)}
                    className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <img
                    src={selectedProfile.avatar_url || `https://ui-avatars.com/api/?name=${selectedProfile.first_name}+${selectedProfile.last_name}&background=random&size=40`}
                    className="w-10 h-10 rounded-full object-cover border-2 border-slate-100"
                    alt=""
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800">{selectedProfile.first_name} {selectedProfile.last_name}</p>
                    <div className="flex items-center gap-1.5">
                      <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Alumni</span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 bg-slate-50/50">
                  {groupedMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <UserCircle className="w-16 h-16 text-slate-200 mb-3" />
                      <p className="text-sm font-bold text-slate-400">Start your conversation</p>
                      <p className="text-xs text-slate-300 mt-1">Send a message to {selectedProfile.first_name}.</p>
                    </div>
                  ) : (
                    groupedMessages.map((group, gi) => (
                      <div key={gi}>
                        <div className="flex justify-center my-4">
                          <span className="px-3 py-1 bg-slate-200/70 rounded-full text-[10px] font-bold text-slate-500">{group.date}</span>
                        </div>
                        {group.messages.map(msg => {
                          const isMine = msg.sender_id === user?.id;
                          return (
                            <div key={msg.id} className={`flex mb-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                                isMine
                                  ? 'bg-blue-600 text-white rounded-br-md'
                                  : 'bg-white text-slate-700 border border-slate-100 rounded-bl-md shadow-sm'
                              }`}>
                                {msg.attachment_url && msg.attachment_type === 'image' && (
                                  <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="block mb-1.5">
                                    <img src={msg.attachment_url} alt={msg.attachment_name || 'image'} className="max-w-full max-h-52 rounded-xl object-cover" />
                                  </a>
                                )}
                                {msg.attachment_url && msg.attachment_type === 'file' && (
                                  <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 mb-1.5 px-3 py-2 rounded-xl text-xs font-bold ${isMine ? 'bg-blue-500/30 text-white hover:bg-blue-500/50' : 'bg-slate-50 text-blue-600 hover:bg-blue-50 border border-slate-200'}`}>
                                    <FileText className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">{msg.attachment_name || 'File'}</span>
                                    <Download className="w-3.5 h-3.5 flex-shrink-0" />
                                  </a>
                                )}
                                {msg.content && (
                                  <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                                )}
                                <p className={`text-[10px] mt-1 ${isMine ? 'text-blue-200' : 'text-slate-300'}`}>
                                  {formatMessageTime(msg.created_at)}
                                  {isMine && <span className="ml-1">{msg.read ? '✓✓' : '✓'}</span>}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* File Preview */}
                {selectedFile && (
                  <div className="px-5 py-2 border-t border-slate-100 bg-blue-50 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-xs font-bold text-blue-700 truncate flex-1">{selectedFile.name}</span>
                    <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="p-1 hover:bg-blue-100 rounded">
                      <X className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                  </div>
                )}

                {/* Input */}
                <div className="px-5 py-3.5 border-t border-slate-100 bg-white">
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-2xl transition-colors"
                      title="Attach file"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 bg-slate-50 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() && !selectedFile}
                      className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="w-10 h-10 text-blue-300" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Your Messages</h3>
                <p className="text-sm text-slate-400 mt-2 max-w-xs">Select a conversation or start a new chat with fellow alumni and admins.</p>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="mt-5 px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-colors"
                >
                  New Message
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4" onClick={() => setShowNewChat(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800">New Message</h3>
              <button onClick={() => setShowNewChat(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                  placeholder="Search alumni or admin..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-200"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto px-2 pb-4">
              {filteredContacts.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-8">No contacts found</p>
              ) : (
                filteredContacts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => startNewChat(p.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all text-left"
                  >
                    <div className="relative">
                      <img
                        src={p.avatar_url || `https://ui-avatars.com/api/?name=${p.first_name}+${p.last_name}&background=random&size=40`}
                        className="w-10 h-10 rounded-full object-cover border-2 border-slate-100"
                        alt=""
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{p.first_name} {p.last_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Alumni</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlumniMessages;

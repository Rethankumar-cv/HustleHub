import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './ChatPage.css';

function formatTime(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
    const { conversationId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // 1. Fetch conversation details & initial messages
    useEffect(() => {
        if (!user || !conversationId) return;

        const initChat = async () => {
            setLoading(true);

            // Fetch the conversation info (gig details & parties)
            const { data: convData, error: convErr } = await supabase
                .from('conversations')
                .select(`
                    id,
                    gig_id,
                    poster_id,
                    acceptor_id,
                    gig:gigs(title)
                `)
                .eq('id', conversationId)
                .single();

            if (convErr || !convData) {
                console.error('Error fetching conversation:', convErr);
                setLoading(false);
                return;
            }

            // Fetch the user names manually
            const userIds = [convData.poster_id, convData.acceptor_id];
            const { data: usersData } = await supabase
                .from('users')
                .select('id, full_name')
                .in('id', userIds);

            let posterName = 'Unknown';
            let acceptorName = 'Unknown';

            if (usersData) {
                const p = usersData.find(u => u.id === convData.poster_id);
                const a = usersData.find(u => u.id === convData.acceptor_id);
                if (p) posterName = p.full_name;
                if (a) acceptorName = a.full_name;
            }

            // Verify user is part of it
            if (convData.poster_id !== user.id && convData.acceptor_id !== user.id) {
                navigate('/messages');
                return;
            }

            // Map to standard conversation object
            setConversation({
                ...convData,
                poster: { id: convData.poster_id, full_name: posterName },
                acceptor: { id: convData.acceptor_id, full_name: acceptorName }
            });

            // Fetch previous messages
            const { data: msgData, error: msgErr } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (!msgErr && msgData) {
                setMessages(msgData);
            }

            setLoading(false);
            setTimeout(scrollToBottom, 100);
        };

        initChat();
    }, [conversationId, user, navigate]);

    // 2. Real-time Subscription for new messages
    useEffect(() => {
        if (!conversationId) return;

        const channel = supabase
            .channel(`public:messages:conversation_id=eq.${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    const newMsg = payload.new;
                    setMessages(prev => [...prev, newMsg]);
                    setTimeout(scrollToBottom, 100);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId]);

    // 3. Send Message
    const handleSend = async (e) => {
        e.preventDefault();
        const content = newMessage.trim();
        if (!content || sending) return;

        setSending(true);
        setNewMessage('');

        const { error } = await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content: content
        });

        if (error) {
            console.error('Send error:', error);
            setNewMessage(content); // Restore if failed
        }

        setSending(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="chat-loading">Loading chat...</div>
            </AppLayout>
        );
    }

    if (!conversation) return null;

    const isPoster = conversation.poster.id === user.id;
    const otherParty = isPoster ? conversation.acceptor : conversation.poster;

    return (
        <AppLayout>
            <div className="chat-container">
                <div className="chat-window">
                    {/* Header */}
                    <div className="chat-header">
                        <button className="chat-back" onClick={() => navigate('/messages')}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                        </button>
                        <div className="chat-header-info">
                            <h2>{otherParty.full_name}</h2>
                            <p>About: <strong>{conversation.gig?.title}</strong></p>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="chat-messages">
                        {messages.length === 0 ? (
                            <div className="chat-empty">
                                <span>👋</span>
                                <p>This is the start of your conversation with {otherParty.full_name}.</p>
                            </div>
                        ) : (
                            messages.map(msg => {
                                const isMine = msg.sender_id === user.id;
                                return (
                                    <div key={msg.id} className={`chat-bubble-wrap ${isMine ? 'mine' : 'theirs'}`}>
                                        <div className="chat-bubble">
                                            <p className="chat-text">{msg.content}</p>
                                            <span className="chat-time">{formatTime(msg.created_at)}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="chat-input-area">
                        <form className="chat-form" onSubmit={handleSend}>
                            <textarea
                                className="chat-input"
                                placeholder="Type a message... (Enter to send)"
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={1}
                                disabled={sending}
                            />
                            <button
                                type="submit"
                                className="chat-send-btn"
                                disabled={!newMessage.trim() || sending}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

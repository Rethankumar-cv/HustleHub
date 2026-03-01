import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './MessagesPage.css';

function timeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

export default function MessagesPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const loadConversations = async () => {
            setLoading(true);

            // 1. Fetch conversations where user is poster or acceptor
            const { data: convData, error: convErr } = await supabase
                .from('conversations')
                .select(`
                    id,
                    created_at,
                    gig_id,
                    poster_id,
                    acceptor_id,
                    gig:gigs(title)
                `)
                .or(`poster_id.eq.${user.id},acceptor_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (convErr) {
                console.error('Error fetching conversations:', convErr);
                setLoading(false);
                return;
            }

            // 1.5 Fetch user names for the other parties manually 
            // (Because poster_id and acceptor_id point to auth.users, they cannot be joined via public shorthand)
            const otherUserIds = [];
            convData.forEach(c => {
                if (c.poster_id !== user.id) otherUserIds.push(c.poster_id);
                if (c.acceptor_id !== user.id) otherUserIds.push(c.acceptor_id);
            });
            const uniqueOtherUserIds = [...new Set(otherUserIds)];

            let usersMap = {};
            if (uniqueOtherUserIds.length > 0) {
                const { data: usersData } = await supabase
                    .from('users')
                    .select('id, full_name')
                    .in('id', uniqueOtherUserIds);

                if (usersData) {
                    usersData.forEach(u => usersMap[u.id] = u);
                }
            }

            // 2. We can't easily join the LATEST message per conversation natively in supabase-js 
            // without a custom RPC or complex subquery, so we'll fetch the latest message for each 
            // conversation in a separate query or loop since the list is small.
            const convIds = convData.map(c => c.id);
            let latestMessagesMap = {};

            if (convIds.length > 0) {
                const { data: msgData, error: msgErr } = await supabase
                    .from('messages')
                    .select('conversation_id, content, created_at, sender_id')
                    .in('conversation_id', convIds)
                    .order('created_at', { ascending: false });

                if (!msgErr && msgData) {
                    msgData.forEach(msg => {
                        if (!latestMessagesMap[msg.conversation_id]) {
                            latestMessagesMap[msg.conversation_id] = msg;
                        }
                    });
                }
            }

            // 3. Map into display format
            const formatted = convData.map(c => {
                const isPoster = c.poster_id === user.id;
                const otherPartyId = isPoster ? c.acceptor_id : c.poster_id;
                const otherPartyName = usersMap[otherPartyId]?.full_name || 'Unknown User';
                const lastMsg = latestMessagesMap[c.id];

                return {
                    id: c.id,
                    gigTitle: c.gig?.title || 'Unknown Gig',
                    otherPartyName: otherPartyName,
                    otherPartyInitial: otherPartyName[0].toUpperCase(),
                    role: isPoster ? 'Poster' : 'Acceptor',
                    lastMessage: lastMsg?.content || 'No messages yet.',
                    lastMessageTime: lastMsg ? timeAgo(lastMsg.created_at) : timeAgo(c.created_at),
                    lastMessageTimestamp: lastMsg ? new Date(lastMsg.created_at).getTime() : new Date(c.created_at).getTime(),
                    isLastMine: lastMsg?.sender_id === user.id
                };
            });

            // Re-sort by latest message time
            formatted.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);

            setConversations(formatted);
            setLoading(false);
        };

        loadConversations();
    }, [user]);

    return (
        <AppLayout>
            <div className="msg-page">
                <div className="msg-header">
                    <h1 className="msg-title">Messages</h1>
                    <p className="msg-subtitle">Chat with other hustlers about your active gigs.</p>
                </div>

                <div className="msg-list-container">
                    {loading ? (
                        <div className="msg-loading">Loading conversations...</div>
                    ) : conversations.length === 0 ? (
                        <div className="msg-empty-state">
                            <span className="msg-empty-icon">💬</span>
                            <h3>No messages yet</h3>
                            <p>Once you accept a gig or someone accepts yours, you can chat with them here.</p>
                        </div>
                    ) : (
                        <div className="msg-list">
                            {conversations.map(conv => (
                                <div
                                    key={conv.id}
                                    className="msg-row"
                                    onClick={() => navigate(`/chat/${conv.id}`)}
                                >
                                    <div className="msg-avatar">
                                        {conv.otherPartyInitial}
                                    </div>
                                    <div className="msg-row-content">
                                        <div className="msg-row-top">
                                            <h3 className="msg-party-name">{conv.otherPartyName}</h3>
                                            <span className="msg-time">{conv.lastMessageTime}</span>
                                        </div>
                                        <div className="msg-gig-title">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                            {conv.gigTitle}
                                        </div>
                                        <p className="msg-preview">
                                            {conv.isLastMine && <span className="msg-you">You: </span>}
                                            {conv.lastMessage?.length > 80 ? conv.lastMessage.slice(0, 80) + '...' : conv.lastMessage}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

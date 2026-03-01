import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal';
import ViewReviewsModal from '../components/ViewReviewsModal';
import PowModal from '../components/PowModal';
import './ProfilePage.css';

const SKILL_OPTIONS = [
    'React', 'Python', 'Figma', 'UI/UX', 'Node.js', 'Machine Learning',
    'Content Writing', 'Video Editing', 'Data Analysis', 'Java', 'Flutter',
    'DevOps', 'Photography', 'Copywriting', 'Research', 'Excel / Sheets'
];

function getReputation(score) {
    if (score >= 200) return { label: 'Pro Hustler', icon: '🚀', color: '#7C3AED', bg: '#EDE9FE' };
    if (score >= 80) return { label: 'Rising Hustler', icon: '📈', color: '#0F766E', bg: '#CCFBF1' };
    return { label: 'Beginner', icon: '🌱', color: '#6B7280', bg: '#F3F4F6' };
}

function timeAgo(date) {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}

const ST = {
    open: { bg: '#EDE9FE', color: '#6D28D9' },
    in_progress: { bg: '#FEF9C3', color: '#B45309' },
    completed: { bg: '#DCFCE7', color: '#15803D' },
};

export default function ProfilePage() {
    const { user, profile, fetchProfile } = useAuth();
    const navigate = useNavigate();

    const [postedGigs, setPostedGigs] = useState([]);
    const [acceptedGigs, setAcceptedGigs] = useState([]);
    const [rank, setRank] = useState(null);
    const [activeTab, setActiveTab] = useState('posted');
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [completing, setCompleting] = useState(null);
    const [toast, setToast] = useState('');

    // Edit modal
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ full_name: '', bio: '', skills: [] });
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

    // Review Modal
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [gigToReview, setGigToReview] = useState(null);
    const [submittingReview, setSubmittingReview] = useState(false);

    // View Reviews Modal
    const [viewReviewsOpen, setViewReviewsOpen] = useState(false);

    // AI Proof of Work Portfolio
    const [portfolioCards, setPortfolioCards] = useState([]);
    const [selectedPowCard, setSelectedPowCard] = useState(null);

    const showToast = (msg) => {
        setToast(msg); setTimeout(() => setToast(''), 4000);
    };

    const loadGigs = async () => {
        if (!user) return;
        setLoading(true);

        // IMPORTANT: Do NOT use join shorthand for accepted_by → FK points to auth.users
        // which cannot be joined via the public schema shorthand. Use plain select instead.
        const [{ data: posted, error: postedErr }, { data: accepted, error: acceptedErr }, { data: allUsers }, { data: powCards }] = await Promise.all([
            supabase.from('gigs').select('*, conversations(id)').eq('posted_by', user.id).order('created_at', { ascending: false }),
            supabase.from('gigs').select('*, conversations(id)').eq('accepted_by', user.id).order('created_at', { ascending: false }),
            supabase.from('users').select('id, hustle_score, full_name').order('hustle_score', { ascending: false }),
            supabase.from('proof_of_work').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        ]);

        if (postedErr) console.error('[Profile] posted gigs error:', postedErr);
        if (acceptedErr) console.error('[Profile] accepted gigs error:', acceptedErr);

        // Debug: log what came back so you can verify in browser console
        console.log('[Profile] user.id:', user.id);
        console.log('[Profile] accepted gigs fetched:', accepted);

        // Build a name lookup map from the public users table
        const nameMap = {};
        (allUsers || []).forEach(u => { nameMap[u.id] = u.full_name; });

        // Attach poster/acceptor names manually from the public users table
        const postedWithNames = (posted || []).map(g => ({
            ...g,
            acceptor: g.accepted_by ? { full_name: nameMap[g.accepted_by] || null } : null,
        }));
        const acceptedWithNames = (accepted || []).map(g => ({
            ...g,
            poster: g.posted_by ? { full_name: nameMap[g.posted_by] || null } : null,
        }));

        setPostedGigs(postedWithNames);
        setAcceptedGigs(acceptedWithNames);

        if (allUsers) {
            const pos = allUsers.findIndex(u => u.id === user.id);
            setRank(pos >= 0 ? pos + 1 : null);
        }

        if (powCards) {
            setPortfolioCards(powCards);
        }

        setLoading(false);
    };

    // Load gigs on mount and whenever user changes
    useEffect(() => { loadGigs(); }, [user]);

    // Refetch when user navigates back to this tab (e.g. after accepting a gig on Browse page)
    useEffect(() => {
        const handleFocus = () => { loadGigs(); };
        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') loadGigs();
        });
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [user]);


    useEffect(() => {
        if (profile) setEditForm({ full_name: profile.full_name || '', bio: profile.bio || '', skills: profile.skills || [] });
    }, [profile]);

    // Derived values — read from updated profile columns
    const hustleScore = profile?.hustle_score ?? 100;
    const reputation = getReputation(hustleScore);
    const completedGigs = [...postedGigs, ...acceptedGigs].filter(g => g.status === 'completed');
    const totalGigs = postedGigs.length + acceptedGigs.length;
    const completionRate = totalGigs > 0 ? Math.round((completedGigs.length / totalGigs) * 100) : 0;

    // Lazily create conversation if it doesn't exist (for legacy accepted gigs)
    const handleChatClick = async (gig) => {
        if (gig.conversations?.[0]?.id) {
            navigate(`/chat/${gig.conversations[0].id}`);
            return;
        }

        const { data: convData, error } = await supabase.from('conversations').insert({
            gig_id: gig.id,
            poster_id: gig.posted_by,
            acceptor_id: gig.accepted_by,
        }).select('id').single();

        if (!error && convData) {
            navigate(`/chat/${convData.id}`);
        } else {
            console.error('[HustleHub] Failed to create lazy conversation:', error);
            await loadGigs();
        }
    };

    // Mark a gig as completed (from poster's side)
    const handleComplete = async (gig) => {
        setCompleting(gig.id);
        const completedAt = new Date().toISOString();

        const { error } = await supabase
            .from('gigs')
            .update({ status: 'completed', completed_at: completedAt })
            .eq('id', gig.id);

        if (!error) {
            // Increment completed count + hustle score for the acceptor
            if (gig.accepted_by) {
                const { data: acceptorData } = await supabase
                    .from('users')
                    .select('gigs_completed_count, hustle_score')
                    .eq('id', gig.accepted_by)
                    .single();
                if (acceptorData) {
                    await supabase.from('users').update({
                        gigs_completed_count: (acceptorData.gigs_completed_count || 0) + 1,
                        hustle_score: (acceptorData.hustle_score || 100) + 50,
                    }).eq('id', gig.accepted_by);
                }

                // If poster completed it, let them review the worker
                if (gig.posted_by === user.id) {
                    setGigToReview(gig);
                    setReviewModalOpen(true);
                }
            }
            // Log activity
            await supabase.from('activity_log').insert({
                user_id: user.id,
                type: 'gig_completed',
                gig_id: gig.id,
            });
            if (fetchProfile) await fetchProfile(user.id);
            showToast('✅ Gig marked as completed!');
            await loadGigs();
        } else {
            showToast('Failed to complete gig.');
        }
        setCompleting(null);
    };

    // Submit review and update worker's average rating
    const handleReviewSubmit = async ({ rating, reviewText }) => {
        setSubmittingReview(true);
        const workerId = gigToReview.accepted_by;

        const { error: reviewErr } = await supabase.from('reviews').insert({
            gig_id: gigToReview.id,
            reviewer_id: user.id,
            reviewed_user_id: workerId,
            rating,
            review_text: reviewText || null
        });

        if (reviewErr) {
            console.error('Review insert error:', reviewErr);
            showToast('❌ Failed to submit review. You may have already reviewed this gig.');
            setSubmittingReview(false);
            setReviewModalOpen(false);
            setGigToReview(null);
            return;
        }

        // Recalculate average rating
        const { data: userData } = await supabase
            .from('users')
            .select('average_rating, total_reviews')
            .eq('id', workerId)
            .single();

        if (userData) {
            const oldAvg = userData.average_rating || 0;
            const oldTotal = userData.total_reviews || 0;
            const newAvg = ((oldAvg * oldTotal) + rating) / (oldTotal + 1);

            await supabase
                .from('users')
                .update({
                    average_rating: newAvg,
                    total_reviews: oldTotal + 1
                })
                .eq('id', workerId);
        }

        const gigTitle = gigToReview.title;
        const gigDesc = gigToReview.description;
        const gigId = gigToReview.id;

        showToast('⭐ Review submitted successfully!');
        setSubmittingReview(false);
        setReviewModalOpen(false);
        setGigToReview(null);
        await loadGigs();

        // Auto-generate Proof of Work portfolio card for the worker
        if (rating >= 4) {
            (async () => {
                try {
                    const { data, error } = await supabase.functions.invoke('kai-generate-pow', {
                        body: { gigTitle, gigDescription: gigDesc, clientReview: reviewText }
                    });

                    if (!error && data) {
                        await supabase.from('proof_of_work').insert({
                            user_id: workerId,
                            gig_id: gigId,
                            title: data.title,
                            summary: data.summary,
                            skills_used: data.skills_used || []
                        });
                    }
                } catch (e) {
                    console.error("Failed to generate PoW:", e);
                }
            })();
        }
    };

    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Hustler';
    const handle = '@' + (user?.email?.split('@')[0] || 'hustler').toLowerCase().replace(/[^a-z0-9_]/g, '');
    const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    const referralLink = profile?.referral_code ? `${window.location.origin}/join?ref=${profile.referral_code}` : '';

    const copyLink = () => {
        navigator.clipboard.writeText(referralLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
    };

    const shareWhatsApp = () => {
        const text = `Join HustleHub — the campus micro-gig platform! Sign up using my link: ${referralLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const saveProfile = async () => {
        setSaving(true);
        await supabase.from('users').update({
            full_name: editForm.full_name.trim(),
            bio: editForm.bio,
            skills: editForm.skills,
        }).eq('id', user.id);
        await fetchProfile(user.id);
        setSaving(false);
        setSaveMsg('Profile saved!');
        setEditOpen(false);
        setTimeout(() => setSaveMsg(''), 2500);
    };

    const toggleSkill = (s) => setEditForm(p => ({
        ...p,
        skills: p.skills.includes(s)
            ? p.skills.filter(x => x !== s)
            : p.skills.length < 5 ? [...p.skills, s] : p.skills,
    }));

    const allActivity = [
        ...postedGigs.map(g => ({ type: 'posted', gig: g, date: g.created_at })),
        ...acceptedGigs.map(g => ({ type: 'accepted', gig: g, date: g.created_at })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15);

    const TABS = [
        { id: 'portfolio', label: 'Portfolio', count: portfolioCards.length },
        { id: 'posted', label: 'Posted', count: postedGigs.length },
        { id: 'accepted', label: 'Accepted', count: acceptedGigs.length },
        { id: 'completed', label: 'Completed', count: completedGigs.length },
        { id: 'activity', label: 'Activity', count: allActivity.length },
    ];

    const tabGigs = () => {
        if (activeTab === 'posted') return postedGigs;
        if (activeTab === 'accepted') return acceptedGigs;
        if (activeTab === 'completed') return completedGigs;
        return [];
    };

    return (
        <AppLayout>
            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                    background: '#111827', color: '#fff', padding: '12px 24px', borderRadius: 12,
                    fontWeight: 600, fontSize: 14, zIndex: 9999, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    animation: 'slideUp 0.3s ease'
                }}>
                    {toast}
                </div>
            )}
            {/* ─── SECTION 1: PROFILE HEADER ─── */}
            <div className="pf-header">

                {/* LEFT: Identity */}
                <div className="pf-header__left">
                    <div className="pf-avatar-wrap">
                        <div className="pf-avatar">{initials}</div>
                        <div className="pf-avatar-overlay">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                <circle cx="12" cy="13" r="4" />
                            </svg>
                            <span>Change Photo</span>
                        </div>
                    </div>

                    <div className="pf-identity">
                        <div className="pf-name-row">
                            <h1 className="pf-name">{displayName}</h1>
                            <span className="pf-handle">{handle}</span>

                            {profile?.total_reviews > 0 && (
                                <button className="pf-rating-badge" onClick={() => setViewReviewsOpen(true)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="2">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                    </svg>
                                    <span>{profile.average_rating.toFixed(1)}</span>
                                    <span className="pf-rating-count">({profile.total_reviews} reviews)</span>
                                </button>
                            )}
                        </div>

                        <p className={`pf-bio${!profile?.bio ? ' pf-bio--empty' : ''}`}>
                            {profile?.bio || 'No bio yet — click Edit Profile to add one.'}
                        </p>

                        {profile?.skills?.length > 0 && (
                            <div className="pf-skills">
                                {profile.skills.map(s => <span key={s} className="pf-skill-chip">{s}</span>)}
                            </div>
                        )}

                        <div className="pf-edit-row">
                            <button className="pf-edit-btn" onClick={() => setEditOpen(true)}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit Profile
                            </button>
                            {saveMsg && <span className="pf-save-msg">✓ {saveMsg}</span>}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Stats — pulls from profile columns updated in real-time */}
                <div className="pf-header__right">
                    <div className="pf-stats-row">
                        {[
                            { num: profile?.gigs_completed_count ?? profile?.gigs_completed ?? 0, label: 'Gigs Done' },
                            { num: profile?.gigs_accepted_count ?? acceptedGigs.length, label: 'Accepted' },
                            { num: profile?.referral_count ?? 0, label: 'Referrals' },
                            { num: hustleScore, label: 'Hustle Score' },
                        ].map(s => (
                            <div key={s.label} className="pf-stat-block">
                                <span className="pf-stat-num">{s.num}</span>
                                <span className="pf-stat-label">{s.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className={`pf-activation ${profile?.activated ? 'pf-activation--on' : 'pf-activation--off'}`}>
                        <span className="pf-activation__dot" />
                        {profile?.activated
                            ? "Active Hustler — You're on the board!"
                            : "Activate your account by posting or accepting a gig."}
                    </div>
                </div>
            </div>

            {/* ─── SECTION 2: SOCIAL PROOF STRIP ─── */}
            <div className="pf-proof-strip">
                <span className="pf-proof-pill" style={{ background: reputation.bg, color: reputation.color }}>
                    {reputation.icon} {reputation.label}
                </span>
                <span className="pf-proof-pill">
                    🔥 {profile?.gigs_completed > 0 ? `${profile.gigs_completed} Gig Streak` : 'No streak yet'}
                </span>
                <span className="pf-proof-pill">
                    🏆 {rank ? `Rank #${rank}` : 'Unranked'}
                </span>
                <span className="pf-proof-pill">
                    🎯 {completionRate}% Completion Rate
                </span>
            </div>

            {/* ─── SECTION 3+4+5: TABS + CONTENT ─── */}
            <div className="pf-content-area">
                <div className="pf-tab-bar">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            className={`pf-tab-btn${activeTab === t.id ? ' active' : ''}`}
                            onClick={() => setActiveTab(t.id)}
                        >
                            {t.label}
                            {t.count > 0 && <span className="pf-tab-badge">{t.count}</span>}
                        </button>
                    ))}
                </div>

                <div className="pf-tab-content">
                    {loading ? (
                        <div className="pf-skeleton-grid">
                            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="pf-skel" />)}
                        </div>
                    ) : activeTab === 'portfolio' ? (
                        /* PORTFOLIO TAB */
                        <div className="pf-gig-grid">
                            {portfolioCards.length === 0 ? (
                                <div className="pf-empty-state">
                                    <span className="pf-empty-icon">🏆</span>
                                    <p>No portfolio entries yet. Complete gigs with 4+ star ratings to generate Proof of Work cards!</p>
                                </div>
                            ) : (
                                portfolioCards.map(card => (
                                    <div
                                        key={card.id}
                                        className="pf-gig-card"
                                        style={{ borderTop: '4px solid #10B981', cursor: 'pointer', transition: 'transform 0.2s' }}
                                        onClick={() => setSelectedPowCard(card)}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <div className="pf-gig-card__top">
                                            <span className="pf-gig-status" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', fontWeight: 600 }}>✨ Verified Work</span>
                                            <span className="pf-gig-date">{new Date(card.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="pf-gig-title">{card.title}</h3>
                                        <p className="pf-gig-desc">{card.summary}</p>
                                        {card.skills_used?.length > 0 && (
                                            <div className="pf-gig-tags" style={{ marginTop: '16px' }}>
                                                {card.skills_used.map(t => <span key={t} className="pf-gig-tag" style={{ background: '#F3F4F6', color: '#374151' }}>{t}</span>)}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    ) : activeTab === 'activity' ? (
                        /* TIMELINE */
                        <div className="pf-timeline">
                            {allActivity.length === 0 ? (
                                <div className="pf-empty-state">
                                    <span className="pf-empty-icon">📭</span>
                                    <p>No activity yet. Post or accept a gig to get started!</p>
                                </div>
                            ) : allActivity.map((item, i) => (
                                <div key={i} className="pf-tl-row">
                                    <div className={`pf-tl-dot pf-tl-dot--${item.type}`}>
                                        {item.type === 'posted'
                                            ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                            : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                        }
                                    </div>
                                    {i < allActivity.length - 1 && <div className="pf-tl-line" />}
                                    <div className="pf-tl-body">
                                        <span className="pf-tl-action">
                                            {item.type === 'posted' ? 'Posted' : 'Accepted'}&nbsp;
                                            <strong>"{item.gig.title}"</strong>
                                        </span>
                                        <span className="pf-tl-time">{timeAgo(item.date)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : tabGigs().length === 0 ? (
                        <div className="pf-empty-state">
                            <span className="pf-empty-icon">
                                {activeTab === 'posted' ? '📋' : activeTab === 'accepted' ? '🤝' : '✅'}
                            </span>
                            <p>
                                {activeTab === 'posted' && 'No gigs posted yet.'}
                                {activeTab === 'accepted' && 'No gigs accepted yet.'}
                                {activeTab === 'completed' && 'No completed gigs yet.'}
                            </p>
                        </div>
                    ) : (
                        /* GIG GRID */
                        <div className="pf-gig-grid">
                            {tabGigs().map(g => {
                                const st = ST[g.status] || ST.open;
                                const done = g.status === 'completed';
                                const isOwner = g.posted_by === user.id;
                                const isAcceptor = g.accepted_by === user.id;
                                const canComplete = isOwner && g.status === 'in_progress';
                                return (
                                    <div key={g.id} className={`pf-gig-card${done ? ' pf-gig-card--done' : ''}`}>
                                        {done && <div className="pf-done-badge"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg></div>}
                                        <div className="pf-gig-card__top">
                                            <span className="pf-gig-status" style={{ background: st.bg, color: st.color }}>
                                                {g.status.replace('_', ' ')}
                                            </span>
                                            <span className="pf-gig-date">{new Date(g.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="pf-gig-title">{g.title}</h3>
                                        <p className="pf-gig-desc">{g.description?.slice(0, 100)}{g.description?.length > 100 ? '…' : ''}</p>
                                        {/* Show who accepted (for poster) */}
                                        {isOwner && g.status === 'in_progress' && g.acceptor?.full_name && (
                                            <p style={{ fontSize: 12, color: '#10B981', fontWeight: 600, marginBottom: 8 }}>
                                                🤝 Accepted by {g.acceptor.full_name}
                                            </p>
                                        )}
                                        {g.skill_tags?.length > 0 && (
                                            <div className="pf-gig-tags">
                                                {g.skill_tags.slice(0, 2).map(t => <span key={t} className="pf-gig-tag">{t}</span>)}
                                            </div>
                                        )}
                                        {/* Actions */}
                                        {canComplete && (
                                            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                                <button
                                                    onClick={() => handleChatClick(g)}
                                                    style={{ flex: 1, padding: '8px 0', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                                                >
                                                    💬 Chat
                                                </button>
                                                <button
                                                    onClick={() => handleComplete(g)}
                                                    disabled={completing === g.id}
                                                    style={{ flex: 2, padding: '8px 0', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: completing === g.id ? 0.6 : 1 }}
                                                >
                                                    {completing === g.id ? 'Completing...' : '✓ Complete'}
                                                </button>
                                            </div>
                                        )}
                                        {isAcceptor && g.status === 'in_progress' && (
                                            <button
                                                onClick={() => handleChatClick(g)}
                                                style={{ marginTop: 12, width: '100%', padding: '8px 0', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                                            >
                                                💬 Message Poster
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── SECTION 6: REFERRAL CARD ─── */}
            <div className="pf-ref-card">
                <div className="pf-ref-card__bg" />
                <div className="pf-ref-card__inner">
                    <div className="pf-ref-card__left">
                        <h2 className="pf-ref-headline">Invite your campus.<br />Grow your hustle.</h2>
                        <p className="pf-ref-sub">Every signup through your link counts toward your Hustle Score.</p>
                        <div className="pf-ref-count-pill">
                            🎯 <strong>{profile?.referral_count || 0}</strong> referrals earned
                        </div>
                    </div>
                    <div className="pf-ref-card__right">
                        <div className="pf-ref-code-box">
                            <span className="pf-ref-code-label">Your Code</span>
                            <span className="pf-ref-code-val">{profile?.referral_code || '—'}</span>
                        </div>
                        <div className="pf-ref-btns">
                            <button className={`pf-copy-btn${copied ? ' copied' : ''}`} onClick={copyLink}>
                                {copied
                                    ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg> Copied!</>
                                    : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg> Copy Link</>
                                }
                            </button>
                            <button className="pf-wa-btn" onClick={shareWhatsApp}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.845L.057 23.885l6.184-1.443A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.806 9.806 0 0 1-5.003-1.368l-.36-.214-3.67.856.873-3.582-.235-.369A9.8 9.8 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z" />
                                </svg>
                                WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── SECTION 7: EDIT PROFILE MODAL ─── */}
            {editOpen && (
                <div className="pf-modal-overlay" onClick={e => e.target === e.currentTarget && setEditOpen(false)}>
                    <div className="pf-modal">
                        <div className="pf-modal__head">
                            <h2>Edit Profile</h2>
                            <button className="pf-modal-close" onClick={() => setEditOpen(false)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {/* Live preview */}
                        <div className="pf-modal-preview">
                            <div className="pf-modal-preview__avatar">
                                {(editForm.full_name || displayName).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <div className="pf-modal-preview__name">{editForm.full_name || displayName}</div>
                                <div className="pf-modal-preview__bio">{editForm.bio || 'Your bio will appear here…'}</div>
                                {editForm.skills.length > 0 && (
                                    <div className="pf-modal-preview__skills">
                                        {editForm.skills.map(s => <span key={s} className="pf-skill-chip">{s}</span>)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pf-modal__body">
                            <div className="pf-modal-field">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={editForm.full_name}
                                    onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))}
                                    placeholder="Your full name"
                                />
                            </div>

                            <div className="pf-modal-field">
                                <label>
                                    Bio
                                    <span className="pf-modal-field__hint">{(editForm.bio || '').length}/160</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={editForm.bio}
                                    onChange={e => setEditForm(p => ({ ...p, bio: e.target.value.slice(0, 160) }))}
                                    placeholder="Tell the campus who you are and what you do best…"
                                />
                            </div>

                            <div className="pf-modal-field">
                                <label>
                                    Skills
                                    <span className="pf-modal-field__hint">up to 5</span>
                                </label>
                                <div className="pf-modal-skill-grid">
                                    {SKILL_OPTIONS.map(s => (
                                        <button
                                            key={s} type="button"
                                            className={`pf-modal-chip${editForm.skills.includes(s) ? ' selected' : ''}`}
                                            onClick={() => toggleSkill(s)}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pf-modal__foot">
                            <button className="btn btn-secondary" onClick={() => setEditOpen(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
                                {saving ? 'Saving…' : 'Save Profile'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            <ReviewModal
                isOpen={reviewModalOpen}
                onClose={() => { setReviewModalOpen(false); setGigToReview(null); }}
                onSubmit={handleReviewSubmit}
                gig={gigToReview}
                workerName={gigToReview?.acceptor?.full_name}
                isSubmitting={submittingReview}
            />

            {/* View Reviews Modal */}
            <ViewReviewsModal
                isOpen={viewReviewsOpen}
                onClose={() => setViewReviewsOpen(false)}
                userId={user.id}
                userName={displayName}
            />

            {/* View Proof of Work Modal */}
            <PowModal
                isOpen={!!selectedPowCard}
                onClose={() => setSelectedPowCard(null)}
                card={selectedPowCard}
            />
        </AppLayout>
    );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/AppLayout';
import { supabase } from '../lib/supabase';
import './DashboardPage.css';

function timeAgo(date) {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

const ACTIVITY_META = {
    gig_accepted: { icon: '🤝', label: 'Accepted a gig', color: '#10B981' },
    gig_posted: { icon: '📝', label: 'Posted a gig', color: '#6366F1' },
    gig_completed: { icon: '✅', label: 'Completed a gig', color: '#16A34A' },
    referral_joined: { icon: '🔗', label: 'Got a new referral', color: '#F59E0B' },
};

export default function DashboardPage() {
    const { user, profile, fetchProfile } = useAuth();
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);

    // Fetched data
    const [activityLog, setActivityLog] = useState([]);
    const [gigTitles, setGigTitles] = useState({});
    const [campusStats, setCampusStats] = useState({ hustlers: 0, openGigs: 0 });
    const [loading, setLoading] = useState(true);

    const referralLink = profile?.referral_code
        ? `${window.location.origin}/join?ref=${profile.referral_code}`
        : '';

    // ─── FETCH DASHBOARD DATA ─────────────────────
    useEffect(() => {
        if (!user?.id) return;

        async function fetchAll() {
            setLoading(true);
            try {
                // 1. Pull this user's recent activity log (up to 5)
                const { data: logs } = await supabase
                    .from('activity_log')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                const logData = logs || [];
                setActivityLog(logData);

                // 2. Fetch gig titles for each log entry that has a gig_id
                const gigIds = logData.filter(l => l.gig_id).map(l => l.gig_id);
                if (gigIds.length > 0) {
                    const { data: gigs } = await supabase
                        .from('gigs')
                        .select('id, title')
                        .in('id', gigIds);

                    const titleMap = {};
                    (gigs || []).forEach(g => { titleMap[g.id] = g.title; });
                    setGigTitles(titleMap);
                }

                // 3. Campus-wide stats
                const [{ count: hustlers }, { count: openGigs }] = await Promise.all([
                    supabase.from('users').select('*', { count: 'exact', head: true }),
                    supabase.from('gigs').select('*', { count: 'exact', head: true }).eq('status', 'open'),
                ]);
                setCampusStats({ hustlers: hustlers || 0, openGigs: openGigs || 0 });

            } catch (err) {
                console.error('Dashboard fetch error:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchAll();
        // Re-run when profile.activated or hustle_score changes (happens after accept)
    }, [user?.id, profile?.activated, profile?.hustle_score]);

    const copyReferralLink = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };

    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Hustler';
    const firstName = displayName.split(' ')[0];

    // ─── STATS — Read directly from profile columns ─────
    // (These columns are now updated atomically in confirmAccept / handleComplete)
    const gigsCompleted = profile?.gigs_completed_count ?? profile?.gigs_completed ?? 0;
    const gigsAccepted = profile?.gigs_accepted_count ?? 0;
    const gigsPosted = profile?.gigs_posted_count ?? 0;
    const referrals = profile?.referral_count ?? 0;
    const hustleScore = profile?.hustle_score ?? 100;

    const isActivated = profile?.activated || false;
    const activationProgress = isActivated ? 100
        : (gigsPosted > 0 && gigsAccepted > 0) ? 100
            : (gigsPosted > 0 || gigsAccepted > 0) ? 50 : 0;

    const campusInsights = [
        { label: 'Total Hustlers', val: campusStats.hustlers, icon: '👨‍🎓' },
        { label: 'Open Gigs', val: campusStats.openGigs, icon: '🎯' },
        { label: 'Gigs Done Today', val: 14, icon: '✅' },
        { label: 'New Signups', val: '+22', icon: '🔥' },
    ];

    return (
        <AppLayout>
            <div className="command-center">

                {/* Welcome Header */}
                <div className="cmd-header">
                    <div className="cmd-header-left">
                        <h1 className="cmd-greeting">Welcome back, {firstName} 👋</h1>
                        <p className="cmd-subtitle">Track your gigs, referrals, and campus hustle growth.</p>
                    </div>
                    <div className="cmd-header-right">
                        {isActivated ? (
                            <div className="activation-badge is-active">
                                <span className="badge-dot pulse-green"></span>
                                Active Hustler
                            </div>
                        ) : (
                            <div className="activation-badge is-pending">
                                <div className="badge-row">
                                    <span className="badge-dot bg-yellow"></span>
                                    Pending Activation
                                </div>
                                <span className="badge-subtext">Post or accept one gig to activate</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="cmd-layout">
                    {/* ─── MAIN COLUMN ─── */}
                    <div className="cmd-main-col">

                        {/* Activation Progress (only if not activated) */}
                        {!isActivated && (
                            <div className="cmd-card activation-card">
                                <h3>Get Activated</h3>
                                <div className="progress-bar-container">
                                    <div className="progress-fill" style={{ width: `${activationProgress}%` }}></div>
                                </div>
                                <div className="progress-checklists">
                                    <div className={`check-item ${gigsPosted > 0 ? 'done' : ''}`}>
                                        <span className="checkbox">{gigsPosted > 0 ? '✓' : '☐'}</span>
                                        <span className="check-text">Post a gig</span>
                                    </div>
                                    <div className={`check-item ${gigsAccepted > 0 ? 'done' : ''}`}>
                                        <span className="checkbox">{gigsAccepted > 0 ? '✓' : '☐'}</span>
                                        <span className="check-text">Accept a gig</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Stats Row — 4 cards */}
                        <div className="cmd-stats-grid">
                            <div className="stat-box">
                                <div className="stat-icon bg-blue">✅</div>
                                <div className="stat-val">{loading ? <span className="skel-text-sm" /> : gigsCompleted}</div>
                                <div className="stat-label">Gigs Completed</div>
                                {gigsCompleted === 0 && !loading && <span className="stat-micro">Complete a task to earn.</span>}
                            </div>
                            <div className="stat-box">
                                <div className="stat-icon bg-purple">🤝</div>
                                <div className="stat-val">{loading ? <span className="skel-text-sm" /> : gigsAccepted}</div>
                                <div className="stat-label">Gigs Accepted</div>
                                {gigsAccepted === 0 && !loading && <span className="stat-micro">Browse and accept a gig.</span>}
                            </div>
                            <div className="stat-box">
                                <div className="stat-icon bg-teal">🔗</div>
                                <div className="stat-val">{loading ? <span className="skel-text-sm" /> : referrals}</div>
                                <div className="stat-label">Referrals</div>
                                {referrals === 0 && !loading && <span className="stat-micro">Share link to grow.</span>}
                            </div>
                            <div className="stat-box">
                                <div className="stat-icon bg-orange">🔥</div>
                                <div className="stat-val">{loading ? <span className="skel-text-sm" /> : hustleScore}</div>
                                <div className="stat-label">Hustle Score</div>
                            </div>
                        </div>

                        {/* Quick Actions + Referral */}
                        <div className="cmd-actions-row">
                            <div className="cmd-card quick-actions-card">
                                <h3>Quick Actions</h3>
                                <div className="action-buttons">
                                    <button className="btn-insta-primary" onClick={() => navigate('/post-gig')}>
                                        + Post a Gig
                                    </button>
                                    <button className="btn-insta-secondary" onClick={() => navigate('/gigs')}>
                                        Browse Gigs
                                    </button>
                                </div>
                                <button className="btn-text" onClick={() => navigate('/profile')}>
                                    View My Profile →
                                </button>
                            </div>

                            <div className="cmd-card referral-card">
                                <h3>Grow Your Network</h3>
                                <p className="ref-sub">Every signup through your link increases your rank.</p>
                                <div className="ref-link-box">
                                    <input value={referralLink || 'Loading...'} readOnly className="ref-input" />
                                    <button className={`btn-copy ${copied ? 'copied' : ''}`} onClick={copyReferralLink}>
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                                <div className="ref-stats">
                                    <div className="ref-stat">
                                        <span className="val">{referrals}</span>
                                        <span className="lbl">Total Referrals</span>
                                    </div>
                                    <div className="ref-stat">
                                        <span className="val text-indigo">Top 20%</span>
                                        <span className="lbl">Leaderboard</span>
                                    </div>
                                </div>
                                <button className="btn-whatsapp" onClick={() => {
                                    const text = encodeURIComponent(`Join HustleHub and start earning on campus! ${referralLink}`);
                                    window.open(`https://wa.me/?text=${text}`, '_blank');
                                }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.347-.272.273-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    Share via WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ─── SIDE COLUMN ─── */}
                    <div className="cmd-side-col">

                        {/* Campus Activity */}
                        <div className="cmd-card insights-card">
                            <h3>Campus Activity</h3>
                            <div className="insights-grid">
                                {campusInsights.map((ci, idx) => (
                                    <div key={idx} className="insight-item">
                                        <span className="insight-icon">{ci.icon}</span>
                                        <div className="insight-info">
                                            <span className="insight-val">{loading ? '—' : ci.val}</span>
                                            <span className="insight-label">{ci.label}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity — Real data from activity_log */}
                        <div className="cmd-card feed-card">
                            <h3>Recent Activity</h3>
                            {loading ? (
                                <div className="feed-list">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="feed-item">
                                            <div className="feed-icon" style={{ background: '#F3F4F6' }}></div>
                                            <div className="feed-content">
                                                <span className="skel-text-sm" style={{ width: '80%', height: 14, display: 'block', borderRadius: 4 }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : activityLog.length > 0 ? (
                                <div className="feed-list">
                                    {activityLog.map((item, idx) => {
                                        const meta = ACTIVITY_META[item.type] || { icon: '📋', label: item.type, color: '#6B7280' };
                                        const gigTitle = item.gig_id ? gigTitles[item.gig_id] : null;
                                        return (
                                            <React.Fragment key={item.id}>
                                                <div className="feed-item">
                                                    <div className="feed-icon" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>
                                                        {meta.icon}
                                                    </div>
                                                    <div className="feed-content">
                                                        <p>{meta.label}{gigTitle ? `: "${gigTitle}"` : ''}</p>
                                                        <span>{timeAgo(item.created_at)}</span>
                                                    </div>
                                                </div>
                                                {idx < activityLog.length - 1 && <div className="feed-divider" />}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-feed">
                                    <p style={{ color: '#9CA3AF', fontSize: 14 }}>No activity yet.</p>
                                    <button className="btn-text" onClick={() => navigate('/gigs')}>Browse gigs →</button>
                                </div>
                            )}
                        </div>

                        {/* Top Hustlers (mock leaderboard) */}
                        <div className="cmd-card leaderboard-card">
                            <h3>Top Hustlers 🔥</h3>
                            <div className="lb-list">
                                {['Arjun', 'Meera', 'Rahul'].map((name, idx) => (
                                    <div key={idx} className="lb-item">
                                        <span className="lb-rank">#{idx + 1}</span>
                                        <span className="lb-name">{name}</span>
                                        <span className="lb-score">{3000 - (idx * 400)} pts</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </AppLayout>
    );
}

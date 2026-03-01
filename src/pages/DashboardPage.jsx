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
    gig_accepted: { icon: '🤝', label: 'Accepted a gig', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    gig_posted: { icon: '📝', label: 'Posted a gig', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)' },
    gig_completed: { icon: '✅', label: 'Completed a gig', color: '#16A34A', bg: 'rgba(22, 163, 74, 0.1)' },
    referral_joined: { icon: '🔗', label: 'Got a new referral', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
};

// Animated Counter Hook
function useCountUp(end, duration = 1500) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime = null;
        let animationFrame;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - percentage, 3);
            setCount(Math.floor(end * easeOut));

            if (percentage < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(end); // ensure exact value at end
            }
        };

        if (end > 0) {
            animationFrame = requestAnimationFrame(animate);
        } else {
            setCount(0);
        }

        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return count;
}

// Simple Mini Sparkline Component mapping generic data
const Sparkline = ({ data, color, type }) => {
    // Determine path based on type (line vs bar)
    const points = data.map((d, i) => `${i * 12},${20 - d}`).join(' ');

    if (type === 'bar') {
        return (
            <svg width="60" height="24" viewBox="0 0 60 24" className="sparkline">
                {data.map((h, i) => (
                    <rect key={i} x={i * 8} y={24 - h} width="4" height={h} fill={color} rx="2" />
                ))}
            </svg>
        )
    }

    return (
        <svg width="60" height="24" viewBox="0 0 60 24" className="sparkline">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    )
}

export default function DashboardPage() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);

    // Fetched data
    const [activityLog, setActivityLog] = useState([]);
    const [gigTitles, setGigTitles] = useState({});
    const [campusStats, setCampusStats] = useState({ hustlers: 0, openGigs: 0, completedToday: 0, newSignups: 0 });
    const [topHustlers, setTopHustlers] = useState([]);
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

                // Get today's start date
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayISO = today.toISOString();

                // 3. Campus-wide stats & Top Hustlers
                const [
                    { count: hustlers },
                    { count: openGigs },
                    { data: topUsers },
                    { count: completedToday },
                    { count: newSignups }
                ] = await Promise.all([
                    supabase.from('users').select('*', { count: 'exact', head: true }),
                    supabase.from('gigs').select('*', { count: 'exact', head: true }).eq('status', 'open'),
                    supabase.from('users').select('id, full_name, hustle_score').order('hustle_score', { ascending: false }).limit(5),
                    supabase.from('gigs').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('completed_at', todayISO),
                    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', todayISO)
                ]);

                setCampusStats({
                    hustlers: hustlers || 0,
                    openGigs: openGigs || 0,
                    completedToday: completedToday || 0,
                    newSignups: newSignups || 0
                });
                if (topUsers) setTopHustlers(topUsers);

            } catch (err) {
                console.error('Dashboard fetch error:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchAll();
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
    const gigsCompleted = profile?.gigs_completed_count ?? profile?.gigs_completed ?? 0;
    const gigsAccepted = profile?.gigs_accepted_count ?? 0;
    const gigsPosted = profile?.gigs_posted_count ?? 0;
    const referrals = profile?.referral_count ?? 0;
    const hustleScore = profile?.hustle_score ?? 100;

    const animCompleted = useCountUp(gigsCompleted);
    const animAccepted = useCountUp(gigsAccepted);
    const animReferrals = useCountUp(referrals);
    const animScore = useCountUp(hustleScore, 2000);

    const isActivated = profile?.activated || false;
    const activationProgress = isActivated ? 100
        : (gigsPosted > 0 && gigsAccepted > 0) ? 100
            : (gigsPosted > 0 || gigsAccepted > 0) ? 50 : 0;

    // Calculate level based on score (e.g. 100 = Level 1, 200 = Level 2)
    const currentLevel = Math.floor(hustleScore / 100) || 1;
    const scoreNextLevel = currentLevel * 100 + 100;
    const scoreProgress = ((hustleScore % 100) / 100) * 100;

    const campusInsights = [
        { label: 'Total Hustlers', val: campusStats.hustlers, icon: '👨‍🎓' },
        { label: 'Open Gigs', val: campusStats.openGigs, icon: '🎯' },
        { label: 'Gigs Done Today', val: campusStats.completedToday, icon: '✅' },
        { label: 'New Signups', val: `+${campusStats.newSignups}`, icon: '🔥' },
    ];

    return (
        <AppLayout>
            <div className="dash-container">

                {/* --- MEGA HEADER --- */}
                <div className="dash-mega-header">
                    <div className="mega-left">
                        <div className="mega-avatar-wrap">
                            <div className="mega-avatar">{firstName.charAt(0)}</div>
                            <div className="mega-level-badge">LVL {currentLevel}</div>
                        </div>
                        <div className="mega-text">
                            <h1 className="mega-greeting">What's up, {firstName}! 🚀</h1>
                            <p className="mega-subtitle">Ready to conquer the campus today?</p>
                        </div>
                    </div>

                    <div className="mega-right">
                        <div className="level-box">
                            <div className="level-box-top">
                                <span>Level Progress</span>
                                <strong>{hustleScore} / {scoreNextLevel} XP</strong>
                            </div>
                            <div className="level-bar-bg">
                                <div className="level-bar-fill" style={{ width: `${scoreProgress}%` }}></div>
                            </div>
                            <div className="level-box-bottom">
                                Earn {scoreNextLevel - hustleScore} more XP to reach Level {currentLevel + 1}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dash-layout">
                    {/* ─── MAIN COLUMN ─── */}
                    <div className="dash-main-col">

                        {/* Activation Progress (only if not activated) */}
                        {!isActivated && (
                            <div className="dash-card dash-activation-card">
                                <h3>🚀 Complete Account Setup</h3>
                                <p className="activation-desc">Unlock full earnings by posting or accepting your first gig.</p>
                                <div className="dash-progress-container">
                                    <div className="dash-progress-fill" style={{ width: `${activationProgress}%` }}></div>
                                </div>
                                <div className="dash-checklists">
                                    <div className={`dash-check-item ${gigsPosted > 0 ? 'done' : ''}`}>
                                        <span className="dash-check-icon">{gigsPosted > 0 ? '✓' : '☐'}</span>
                                        <span>Post a Gig</span>
                                    </div>
                                    <div className={`dash-check-item ${gigsAccepted > 0 ? 'done' : ''}`}>
                                        <span className="dash-check-icon">{gigsAccepted > 0 ? '✓' : '☐'}</span>
                                        <span>Accept a Gig</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Interactive Stats Grid */}
                        <div className="dash-stats-grid">
                            <div className="dash-stat-card theme-green">
                                <div className="stat-card-top">
                                    <div className="stat-card-icon">✅</div>
                                    <Sparkline data={[5, 12, 8, 15, 20]} color="#10B981" type="bar" />
                                </div>
                                <div className="stat-card-bottom">
                                    <div className="stat-card-val">{loading ? <span className="skel-text-sm" /> : animCompleted}</div>
                                    <div className="stat-card-lbl">Gigs Completed</div>
                                </div>
                            </div>

                            <div className="dash-stat-card theme-indigo">
                                <div className="stat-card-top">
                                    <div className="stat-card-icon">🤝</div>
                                    <Sparkline data={[3, 5, 4, 8, 12]} color="#6366F1" type="line" />
                                </div>
                                <div className="stat-card-bottom">
                                    <div className="stat-card-val">{loading ? <span className="skel-text-sm" /> : animAccepted}</div>
                                    <div className="stat-card-lbl">Gigs Accepted</div>
                                </div>
                            </div>

                            <div className="dash-stat-card theme-orange">
                                <div className="stat-card-top">
                                    <div className="stat-card-icon">🔗</div>
                                    <Sparkline data={[1, 2, 4, 3, 6]} color="#F59E0B" type="line" />
                                </div>
                                <div className="stat-card-bottom">
                                    <div className="stat-card-val">{loading ? <span className="skel-text-sm" /> : animReferrals}</div>
                                    <div className="stat-card-lbl">Total Referrals</div>
                                </div>
                            </div>

                            <div className="dash-stat-card theme-purple">
                                <div className="stat-card-top">
                                    <div className="stat-card-icon">🔥</div>
                                    <Sparkline data={[8, 4, 12, 16, 22]} color="#8B5CF6" type="bar" />
                                </div>
                                <div className="stat-card-bottom">
                                    <div className="stat-card-val">{loading ? <span className="skel-text-sm" /> : animScore}</div>
                                    <div className="stat-card-lbl">Hustle Score</div>
                                </div>
                            </div>
                        </div>

                        {/* Vertical Timeline - Recent Activity */}
                        <div className="dash-card dash-feed-card">
                            <div className="dash-card-header">
                                <h3>Activity Timeline</h3>
                                <button className="dash-btn-link" onClick={() => navigate('/profile')}>View Profile →</button>
                            </div>

                            <div className="dash-timeline">
                                {loading ? (
                                    <div style={{ padding: '20px', color: '#6B7280' }}>Loading your hustle log...</div>
                                ) : activityLog.length > 0 ? (
                                    activityLog.map((item, idx) => {
                                        const meta = ACTIVITY_META[item.type] || { icon: '📋', label: item.type, color: '#6B7280', bg: '#F3F4F6' };
                                        const gigTitle = item.gig_id ? gigTitles[item.gig_id] : null;
                                        const isLast = idx === activityLog.length - 1;

                                        return (
                                            <div className="timeline-item" key={item.id}>
                                                <div className="timeline-left">
                                                    <div className="timeline-icon" style={{ backgroundColor: meta.bg, color: meta.color }}>
                                                        {meta.icon}
                                                    </div>
                                                    {!isLast && <div className="timeline-line"></div>}
                                                </div>
                                                <div className="timeline-content">
                                                    <div className="timeline-text">
                                                        <strong>{meta.label}</strong>
                                                        {gigTitle && <span className="timeline-gig">"{gigTitle}"</span>}
                                                    </div>
                                                    <div className="timeline-time">{timeAgo(item.created_at)}</div>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="timeline-empty">
                                        <div className="timeline-empty-icon">🌱</div>
                                        <p>Your timeline is empty. Start hustling to see your journey unfold here!</p>
                                        <button className="dash-btn-primary" onClick={() => navigate('/gigs')}>Explore Gigs</button>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* ─── SIDE COLUMN ─── */}
                    <div className="dash-side-col">

                        {/* Actions & Referrals */}
                        <div className="dash-card dash-ref-card">
                            <h3>Invite & Earn XP</h3>
                            <p className="dash-ref-desc">Invite friends to HustleHub and immediately boost your XP when they join.</p>

                            <div className="dash-ref-input-wrap">
                                <input value={referralLink || 'Loading...'} readOnly />
                                <button className={copied ? 'copied' : ''} onClick={copyReferralLink}>
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>

                            <button className="dash-btn-whatsapp" onClick={() => {
                                const text = encodeURIComponent(`Join HustleHub and start earning on campus! ${referralLink}`);
                                window.open(`https://wa.me/?text=${text}`, '_blank');
                            }}>
                                Share on WhatsApp
                            </button>
                        </div>

                        {/* Gamified Leaderboard */}
                        <div className="dash-card dash-lb-card">
                            <h3>Top Campus Hustlers</h3>
                            <div className="dash-lb-list">
                                {loading ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>Loading ranks...</div>
                                ) : topHustlers.length > 0 ? topHustlers.map((hustler, idx) => {
                                    let medal = '';
                                    let lbClass = '';
                                    if (idx === 0) { medal = '🥇'; lbClass = 'first'; }
                                    else if (idx === 1) { medal = '🥈'; lbClass = 'second'; }
                                    else if (idx === 2) { medal = '🥉'; lbClass = 'third'; }
                                    else { medal = `${idx + 1}`; lbClass = 'standard'; }

                                    const targetName = hustler.full_name || 'Hustler';
                                    const shortName = targetName.split(' ')[0];

                                    return (
                                        <div key={hustler.id} className={`dash-lb-item ${lbClass}`}>
                                            <div className="lb-rank-badge">{medal}</div>
                                            <div className="lb-name">{shortName}</div>
                                            <div className="lb-score">{hustler.hustle_score || 0} XP</div>
                                        </div>
                                    )
                                }) : (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>No hustlers yet</div>
                                )}
                            </div>
                        </div>

                        {/* Campus Pulse */}
                        <div className="dash-card dash-pulse-card">
                            <h3>Campus Pulse</h3>
                            <div className="pulse-grid">
                                {campusInsights.map((ci, idx) => (
                                    <div key={idx} className="pulse-item">
                                        <span className="pulse-val">{loading ? '—' : ci.val}</span>
                                        <span className="pulse-lbl">{ci.label}</span>
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

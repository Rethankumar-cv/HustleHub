import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './GigFeedPage.css';

const STATUS_COLORS = {
    open: { bg: '#EEF2FF', color: '#4F46E5', label: 'Open' },
    in_progress: { bg: '#FEF9C3', color: '#B45309', label: 'In Progress' },
    completed: { bg: '#DCFCE7', color: '#15803D', label: 'Completed' },
};

const ALL_SKILLS = [
    'React', 'Python', 'Figma', 'UI/UX', 'Node.js', 'Machine Learning',
    'Content Writing', 'Video Editing', 'Data Analysis', 'Java', 'Flutter',
    'DevOps', 'Photography', 'Copywriting', 'Research', 'Excel / Sheets'
];

const HUSTLE_ACCEPT_POINTS = 30;

function timeAgo(date) {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function parseGigExtras(rawDesc) {
    if (!rawDesc) return { cleanDesc: '', budget: 0, deadline: null };
    let cleanDesc = rawDesc;
    let budget = 0;
    let deadline = null;

    const budgetMatch = rawDesc.match(/\*\*Budget:\*\*\s*₹([\d,]+)/);
    if (budgetMatch) {
        budget = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
        cleanDesc = cleanDesc.replace(/\*\*Budget:\*\*\s*₹[\d,]+/, '');
    }

    const deadlineMatch = rawDesc.match(/\*\*Deadline:\*\*\s*(.+)$/m);
    if (deadlineMatch) {
        deadline = deadlineMatch[1].trim();
        cleanDesc = cleanDesc.replace(/\*\*Deadline:\*\*\s*.+$/m, '');
    }

    cleanDesc = cleanDesc.trim();
    return { cleanDesc, budget, deadline };
}

export default function GigFeedPage() {
    const { user, profile, fetchProfile } = useAuth();
    const navigate = useNavigate();

    const [tab, setTab] = useState('all');
    const [rawGigs, setRawGigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(null);
    const [completing, setCompleting] = useState(null);

    // Filters & Sorting
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
    const [minBudget, setMinBudget] = useState('');
    const [maxBudget, setMaxBudget] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    // UI State
    const [selectedGig, setSelectedGig] = useState(null);
    const [gigToAccept, setGigToAccept] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success'); // success | error

    // ─────────────────────────────────────────
    // FETCH GIGS
    // ─────────────────────────────────────────
    const fetchGigs = useCallback(async () => {
        setLoading(true);
        let query = supabase
            .from('gigs')
            .select(`*, poster:posted_by(id, full_name), acceptor:accepted_by(id, full_name), conversations(id)`)
            .order('created_at', { ascending: false });

        if (tab === 'mine') query = query.eq('posted_by', user.id);
        if (tab === 'accepted') query = query.eq('accepted_by', user.id);

        const { data, error } = await query;
        if (!error) {
            const processed = (data || []).map(g => {
                const extras = parseGigExtras(g.description || '');
                return { ...g, _cleanDesc: extras.cleanDesc, _budget: extras.budget, _deadline: extras.deadline };
            });
            setRawGigs(processed);
        }
        setLoading(false);
    }, [tab, user.id]);

    useEffect(() => { fetchGigs(); }, [fetchGigs]);

    // ─────────────────────────────────────────
    // TOAST
    // ─────────────────────────────────────────
    const showToast = (msg, type = 'success') => {
        setToastMessage(msg);
        setToastType(type);
        setTimeout(() => setToastMessage(''), 4500);
    };

    // ─────────────────────────────────────────
    // FILTER + SORT
    // ─────────────────────────────────────────
    const filteredGigs = useMemo(() => {
        let result = [...rawGigs];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(g =>
                (g.title || '').toLowerCase().includes(q) ||
                (g.skill_tags || []).some(t => t.toLowerCase().includes(q))
            );
        }
        if (selectedSkills.length > 0) {
            result = result.filter(g => (g.skill_tags || []).some(t => selectedSkills.includes(t)));
        }
        if (minBudget !== '') result = result.filter(g => g._budget >= Number(minBudget));
        if (maxBudget !== '') result = result.filter(g => g._budget <= Number(maxBudget));

        if (sortBy === 'newest') {
            result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else if (sortBy === 'highest_budget') {
            result.sort((a, b) => b._budget - a._budget);
        } else if (sortBy === 'closing_soon') {
            result.sort((a, b) => {
                const dateA = a._deadline ? new Date(a._deadline).getTime() : Infinity;
                const dateB = b._deadline ? new Date(b._deadline).getTime() : Infinity;
                return dateA - dateB;
            });
        }

        return result;
    }, [rawGigs, searchQuery, selectedSkills, minBudget, maxBudget, sortBy]);

    // Stats
    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const openGigs = rawGigs.filter(g => g.status === 'open');
        const newToday = rawGigs.filter(g => g.created_at?.startsWith(today)).length;
        const highestBudget = rawGigs.reduce((max, g) => Math.max(max, g._budget), 0);
        return { totalOpen: openGigs.length, newToday, highestBudget };
    }, [rawGigs]);

    // ─────────────────────────────────────────
    // CONFIRM ACCEPT — ATOMIC SEQUENCE
    // ─────────────────────────────────────────
    const confirmAccept = async () => {
        if (!gigToAccept) return;

        // Guard: already accepted
        if (gigToAccept.status !== 'open') {
            showToast('This gig has already been accepted.', 'error');
            setGigToAccept(null);
            return;
        }

        // ── CRITICAL: Get guaranteed auth UUID from Supabase directly ──
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr || !authData?.user) {
            showToast('Authentication error. Please log in again.', 'error');
            return;
        }
        const currentUserId = authData.user.id;

        // Guard: cannot accept your own gig
        if (gigToAccept.posted_by === currentUserId) {
            showToast('You cannot accept your own gig.', 'error');
            setGigToAccept(null);
            return;
        }

        // Debug logging — open browser console to verify IDs match Supabase
        console.log('[HustleHub] Auth UUID:', currentUserId);
        console.log('[HustleHub] Accepting gig:', gigToAccept.id);

        setAccepting(gigToAccept.id);
        const acceptedAt = new Date().toISOString();

        // ── STEP 1: Update gig with verified auth UUID ──
        const { data: updatedGig, error: gigError } = await supabase
            .from('gigs')
            .update({
                status: 'in_progress',
                accepted_by: currentUserId,
                accepted_at: acceptedAt,
            })
            .eq('id', gigToAccept.id)
            .eq('status', 'open')
            .select()
            .single();

        if (gigError || !updatedGig) {
            console.error('[HustleHub] Gig update failed:', gigError);
            showToast('Could not accept gig. It may have already been taken.', 'error');
            setAccepting(null);
            setGigToAccept(null);
            await fetchGigs();
            return;
        }

        console.log('[HustleHub] accepted_by written as:', updatedGig.accepted_by);

        // ── STEP 2: Update user profile counters ──
        const currentAccepted = profile?.gigs_accepted_count || 0;
        const currentScore = profile?.hustle_score || 100;

        const { error: userError } = await supabase.from('users').update({
            activated: true,
            gigs_accepted_count: currentAccepted + 1,
            hustle_score: currentScore + HUSTLE_ACCEPT_POINTS,
        }).eq('id', currentUserId);

        if (userError) console.error('[HustleHub] User update error:', userError);

        // ── STEP 3: Log activity ──
        await supabase.from('activity_log').insert({
            user_id: currentUserId,
            type: 'gig_accepted',
            gig_id: gigToAccept.id,
            created_at: acceptedAt,
        });

        // ── STEP 3.5: Auto-create Chat Conversation ──
        const { data: convData } = await supabase.from('conversations').insert({
            gig_id: gigToAccept.id,
            poster_id: gigToAccept.posted_by,
            acceptor_id: currentUserId,
        }).select('id').single();

        // ── STEP 4: Refresh AuthContext profile ──
        if (fetchProfile) await fetchProfile(currentUserId);

        // ── STEP 5: UI Updates ──
        showToast(`🎉 Gig accepted! Visit your Profile → Accepted tab to see it.`);
        setGigToAccept(null);
        if (selectedGig?.id === gigToAccept.id) {
            // Immediately show the new state with the correct conversation ID
            setSelectedGig({ ...selectedGig, status: 'in_progress', accepted_by: currentUserId, conversations: convData ? [convData] : [] });
        }
        await fetchGigs();
        setAccepting(null);
    };

    // ─────────────────────────────────────────
    // LAZY CHAT CREATION (For Legacy Gigs)
    // ─────────────────────────────────────────
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
            await fetchGigs();
        }
    };


    // ─────────────────────────────────────────
    // MARK AS COMPLETED
    // ─────────────────────────────────────────
    const handleComplete = async (gig) => {
        setCompleting(gig.id);
        const completedAt = new Date().toISOString();

        const { error } = await supabase
            .from('gigs')
            .update({ status: 'completed', completed_at: completedAt })
            .eq('id', gig.id);

        if (!error) {
            // Increment completed count for the acceptor
            if (gig.accepted_by) {
                const { data: u } = await supabase
                    .from('users')
                    .select('gigs_completed_count, hustle_score')
                    .eq('id', gig.accepted_by)
                    .single();

                if (u) {
                    await supabase.from('users').update({
                        gigs_completed_count: (u.gigs_completed_count || 0) + 1,
                        hustle_score: (u.hustle_score || 100) + 50,
                    }).eq('id', gig.accepted_by);
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
            if (selectedGig?.id === gig.id) setSelectedGig(null);
            await fetchGigs();
        } else {
            showToast('Failed to complete gig. Try again.', 'error');
        }
        setCompleting(null);
    };

    const toggleSkillFilter = (skill) => {
        setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
    };

    const clearFilters = () => {
        setSearchQuery(''); setSelectedSkills([]); setMinBudget(''); setMaxBudget(''); setSortBy('newest');
    };

    // ─────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────
    return (
        <AppLayout>
            {/* Toast */}
            {toastMessage && (
                <div className={`toast-notification animate-slide-up ${toastType === 'error' ? 'toast-error' : ''}`}>
                    {toastMessage}
                </div>
            )}

            <div className="market-container">

                {/* Header */}
                <div className="market-header">
                    <div className="header-top">
                        <div className="header-titles">
                            <h1>Browse Open Gigs</h1>
                            <p>Find work that matches your skills and start building your hustle.</p>
                        </div>
                        <button className="btn-insta-primary header-cta" onClick={() => navigate('/post-gig')}>
                            + Post a Gig
                        </button>
                    </div>

                    <div className="stats-row">
                        <div className="stat-card">
                            <span className="stat-label">Total Open Gigs</span>
                            <span className="stat-value">{stats.totalOpen}</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">New Today</span>
                            <span className="stat-value text-green">+{stats.newToday}</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Highest Budget</span>
                            <span className="stat-value text-indigo">₹{stats.highestBudget}</span>
                        </div>
                    </div>
                </div>

                <div className="market-layout">
                    <div className="market-main-col">

                        {/* Tabs */}
                        <div className="gig-tabs-modern">
                            {[['all', 'Marketplace'], ['mine', 'My Posts'], ['accepted', 'My Gigs']].map(([val, label]) => (
                                <button key={val} className={`gig-tab${tab === val ? ' active' : ''}`} onClick={() => setTab(val)}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Filter Bar */}
                        <div className="filter-bar">
                            <div className="filter-row top-row">
                                <div className="search-box">
                                    <span className="search-icon">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Search by title, skill, or keyword..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="search-input"
                                    />
                                </div>
                                <div className="sort-box">
                                    <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                        <option value="newest">Sort: Newest</option>
                                        <option value="highest_budget">Sort: Highest Budget</option>
                                        <option value="closing_soon">Sort: Closing Soon</option>
                                    </select>
                                </div>
                            </div>
                            <div className="filter-row bottom-row">
                                <div className="custom-dropdown">
                                    <button
                                        className={`dropdown-trigger ${selectedSkills.length > 0 ? 'active' : ''}`}
                                        onClick={() => setIsSkillDropdownOpen(!isSkillDropdownOpen)}
                                    >
                                        Skills {selectedSkills.length > 0 && `(${selectedSkills.length})`}
                                        <span className="caret">▼</span>
                                    </button>
                                    {isSkillDropdownOpen && (
                                        <div className="dropdown-menu">
                                            {ALL_SKILLS.map(skill => (
                                                <label key={skill} className="dropdown-item">
                                                    <input type="checkbox" checked={selectedSkills.includes(skill)} onChange={() => toggleSkillFilter(skill)} />
                                                    {skill}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="budget-filter">
                                    <span className="budget-label">Price:</span>
                                    <div className="budget-inputs">
                                        <span className="rupee">₹</span>
                                        <input type="number" placeholder="Min" value={minBudget} onChange={e => setMinBudget(e.target.value)} className="budget-input" />
                                        <span className="dash">-</span>
                                        <span className="rupee">₹</span>
                                        <input type="number" placeholder="Max" value={maxBudget} onChange={e => setMaxBudget(e.target.value)} className="budget-input" />
                                    </div>
                                </div>
                                {(searchQuery || selectedSkills.length > 0 || minBudget || maxBudget || sortBy !== 'newest') && (
                                    <button className="clear-filters-btn" onClick={clearFilters}>Clear All</button>
                                )}
                            </div>
                        </div>

                        {/* Feed */}
                        {loading ? (
                            <div className="feed-grid">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="card-skeleton">
                                        <div className="skel-top" /><div className="skel-body" /><div className="skel-foot" />
                                    </div>
                                ))}
                            </div>
                        ) : filteredGigs.length === 0 ? (
                            <div className="market-empty-state">
                                <div className="empty-illustration">🚀</div>
                                <h3>No gigs available right now</h3>
                                <p>Be the first to post a new micro-task and kickstart the hustle.</p>
                                <button className="btn-insta-primary" onClick={() => navigate('/post-gig')}>Start a Gig</button>
                            </div>
                        ) : (
                            <div className="feed-grid">
                                {filteredGigs.map(gig => {
                                    const st = STATUS_COLORS[gig.status] || STATUS_COLORS.open;
                                    const isOwner = gig.posted_by === user.id;
                                    const isAcceptor = gig.accepted_by === user.id;
                                    const isAccepted = gig.status !== 'open';
                                    const isWorking = accepting === gig.id;

                                    return (
                                        <div key={gig.id} className={`market-card ${isAccepted ? 'card-accepted' : ''}`}>
                                            <div className="card-top">
                                                <span className="status-badge" style={{ background: st.bg, color: st.color }}>
                                                    {st.label}
                                                </span>
                                                <span className="time-posted">{timeAgo(gig.created_at)}</span>
                                            </div>

                                            <div className="card-body">
                                                <h3 className="card-title">{gig.title}</h3>
                                                <p className="card-preview-desc">{gig._cleanDesc?.slice(0, 120)}{gig._cleanDesc?.length > 120 ? '…' : ''}</p>

                                                <div className="card-financials">
                                                    <span className="card-budget">₹{gig._budget > 0 ? gig._budget.toLocaleString() : 'Negotiable'}</span>
                                                    {gig._deadline && <span className="card-deadline">⏳ {gig._deadline}</span>}
                                                </div>

                                                <div className="card-skills">
                                                    {(gig.skill_tags || []).slice(0, 3).map(tag => (
                                                        <span key={tag} className="tag-pill">{tag}</span>
                                                    ))}
                                                    {(gig.skill_tags || []).length > 3 && (
                                                        <span className="tag-pill overflow">+{gig.skill_tags.length - 3}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="card-footer">
                                                <div className="poster-info">
                                                    <div className="poster-avatar">
                                                        {(gig.poster?.full_name || 'A')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <span className="poster-name">
                                                            {gig.poster?.full_name || 'Anonymous'} {isOwner && '(You)'}
                                                        </span>
                                                        {gig.status === 'in_progress' && gig.acceptor?.full_name && (
                                                            <span className="acceptor-label">
                                                                🤝 Accepted by {isAcceptor ? 'you' : gig.acceptor.full_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="card-actions">
                                                    <button className="btn-secondary-sm" onClick={() => setSelectedGig(gig)}>View</button>

                                                    {/* Accept button: only for open gigs not owned by user */}
                                                    {!isOwner && gig.status === 'open' && (
                                                        <button
                                                            className="btn-primary-sm"
                                                            onClick={() => setGigToAccept(gig)}
                                                            disabled={isWorking}
                                                        >
                                                            {isWorking ? <span className="spinner-sm" /> : 'Accept'}
                                                        </button>
                                                    )}

                                                    {/* Already taken indicator */}
                                                    {!isOwner && gig.status === 'in_progress' && !isAcceptor && (
                                                        <span className="btn-taken">Taken</span>
                                                    )}

                                                    {/* Mark complete: poster can complete in-progress gig */}
                                                    {isOwner && gig.status === 'in_progress' && (
                                                        <button
                                                            className="btn-success-sm"
                                                            onClick={() => handleComplete(gig)}
                                                            disabled={completing === gig.id}
                                                        >
                                                            {completing === gig.id ? '...' : '✓ Complete'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Side Panel */}
                    <div className="market-side-col">
                        <div className="activity-panel sticky-panel">
                            <h4 className="panel-title">⚡ Live Activity</h4>
                            <div className="activity-list">
                                <div className="activity-item">
                                    <div className="activity-icon">📝</div>
                                    <div className="activity-details">
                                        <p><strong>Alex</strong> posted a new UI design gig</p>
                                        <span className="activity-time">2m ago</span>
                                    </div>
                                </div>
                                <div className="activity-item">
                                    <div className="activity-icon">🤝</div>
                                    <div className="activity-details">
                                        <p><strong>Sarah</strong> accepted a Python script gig</p>
                                        <span className="activity-time">15m ago</span>
                                    </div>
                                </div>
                                <div className="activity-item">
                                    <div className="activity-icon">👋</div>
                                    <div className="activity-details">
                                        <p><strong>Michael</strong> joined HustleHub</p>
                                        <span className="activity-time">1h ago</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── ACCEPT CONFIRMATION MODAL ─── */}
            {gigToAccept && (
                <div className="modal-overlay" onClick={() => setGigToAccept(null)}>
                    <div className="modal-content accept-modal animate-pop" onClick={e => e.stopPropagation()}>
                        <div className="modal-icon-wrap">🤝</div>
                        <h2>Accept This Gig?</h2>
                        <div className="modal-brief">
                            <h3 className="brief-title">{gigToAccept.title}</h3>
                            <div className="brief-meta">
                                {gigToAccept._budget > 0 && (
                                    <span className="brief-budget">Earn ₹{gigToAccept._budget.toLocaleString()}</span>
                                )}
                                {gigToAccept._deadline && (
                                    <span className="brief-date">⏳ By {gigToAccept._deadline}</span>
                                )}
                            </div>
                        </div>
                        <p className="modal-disclaimer">
                            By accepting, you commit to completing this task. The poster will be notified.
                        </p>
                        <div className="modal-actions-dual">
                            <button className="btn-insta-secondary" onClick={() => setGigToAccept(null)} disabled={!!accepting}>
                                Cancel
                            </button>
                            <button className="btn-insta-primary" onClick={confirmAccept} disabled={!!accepting}>
                                {accepting ? <span className="spinner-sm" /> : 'Confirm Accept'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── VIEW DETAILS DRAWER ─── */}
            {selectedGig && (
                <>
                    <div className="drawer-overlay" onClick={() => setSelectedGig(null)} />
                    <div className="side-drawer">
                        <button className="close-drawer" onClick={() => setSelectedGig(null)}>✕</button>

                        <div className="drawer-header">
                            <span className="drawer-badge" style={{
                                background: STATUS_COLORS[selectedGig.status]?.bg,
                                color: STATUS_COLORS[selectedGig.status]?.color
                            }}>
                                {STATUS_COLORS[selectedGig.status]?.label}
                            </span>
                            <h2>{selectedGig.title}</h2>
                            <div className="drawer-poster">
                                Posted by <strong>{selectedGig.poster?.full_name || 'Anonymous'}</strong> · {timeAgo(selectedGig.created_at)}
                            </div>
                            {selectedGig.status === 'in_progress' && selectedGig.acceptor?.full_name && (
                                <div className="drawer-acceptor">
                                    🤝 Accepted by <strong>{selectedGig.accepted_by === user.id ? 'you' : selectedGig.acceptor.full_name}</strong>
                                </div>
                            )}
                        </div>

                        <div className="drawer-body">
                            <div className="drawer-financials">
                                <div className="financial-box">
                                    <span className="box-label">Budget</span>
                                    <span className="box-val text-indigo">
                                        ₹{selectedGig._budget > 0 ? selectedGig._budget.toLocaleString() : 'Negotiable'}
                                    </span>
                                </div>
                                {selectedGig._deadline && (
                                    <div className="financial-box">
                                        <span className="box-label">Deadline</span>
                                        <span className="box-val">{selectedGig._deadline}</span>
                                    </div>
                                )}
                            </div>

                            <div className="drawer-section">
                                <h3>Description</h3>
                                <div className="drawer-desc">{selectedGig._cleanDesc}</div>
                            </div>

                            <div className="drawer-section">
                                <h3>Required Skills</h3>
                                <div className="drawer-skills">
                                    {(selectedGig.skill_tags || []).map(tag => (
                                        <span key={tag} className="tag-pill lg">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="drawer-footer">
                            {/* Poster: can mark as complete */}
                            {selectedGig.posted_by === user.id && selectedGig.status === 'in_progress' ? (
                                <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                                    <button
                                        className="btn-insta-secondary"
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                        onClick={() => handleChatClick(selectedGig)}
                                    >
                                        💬 Chat
                                    </button>
                                    <button
                                        className="btn-insta-success"
                                        style={{ flex: 2 }}
                                        onClick={() => handleComplete(selectedGig)}
                                        disabled={!!completing}
                                    >
                                        {completing ? 'Completing...' : '✓ Complete'}
                                    </button>
                                </div>
                            ) : selectedGig.accepted_by === user.id && selectedGig.status === 'in_progress' ? (
                                <button
                                    className="btn-insta-success full-width"
                                    onClick={() => handleChatClick(selectedGig)}
                                >
                                    💬 Message Poster
                                </button>
                            ) : selectedGig.posted_by !== user.id && selectedGig.status === 'open' ? (
                                <button
                                    className="btn-insta-primary full-width"
                                    onClick={() => { setSelectedGig(null); setGigToAccept(selectedGig); }}
                                >
                                    Accept This Gig
                                </button>
                            ) : (
                                <button className="btn-insta-secondary full-width" onClick={() => setSelectedGig(null)}>
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </AppLayout>
    );
}

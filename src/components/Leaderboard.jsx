import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './Leaderboard.css';

const MOCK = [
    { rank: 1, full_name: 'Arjun Sharma', referral_code: 'ARJ123', gigs_completed: 24, referral_count: 12 },
    { rank: 2, full_name: 'Priya Kapoor', referral_code: 'PRI456', gigs_completed: 19, referral_count: 9 },
    { rank: 3, full_name: 'Rohit Nair', referral_code: 'ROH789', gigs_completed: 17, referral_count: 15 },
    { rank: 4, full_name: 'Sneha Menon', referral_code: 'SNE012', gigs_completed: 14, referral_count: 8 },
    { rank: 5, full_name: 'Aarav Joshi', referral_code: 'AAR345', gigs_completed: 11, referral_count: 6 },
];

const rankColors = ['#F59E0B', '#9CA3AF', '#D97706', '#6B7280', '#6B7280'];

export default function Leaderboard() {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaders = async () => {
            const { data, error } = await supabase
                .from('users')
                .select('id, full_name, gigs_completed, referral_count, referral_code')
                .order('gigs_completed', { ascending: false })
                .order('referral_count', { ascending: false })
                .limit(5);

            if (error || !data || data.length === 0) {
                // Fall back to mock data
                setLeaders(MOCK);
            } else {
                setLeaders(data.map((u, i) => ({ ...u, rank: i + 1 })));
            }
            setLoading(false);
        };
        fetchLeaders();
    }, []);

    return (
        <section id="leaderboard" className="leaderboard section">
            <div className="container">
                <div className="section-header centered">
                    <p className="section-eyebrow">Community</p>
                    <h2 className="section-title">Top Hustlers This Week</h2>
                    <p className="section-desc">
                        Recognition drives motivation. The leaderboard surfaces students who are consistently delivering.
                    </p>
                </div>

                <div className="lb-wrapper">
                    <div className="lb-header">
                        <span className="lb-col rank-col">Rank</span>
                        <span className="lb-col student-col">Student</span>
                        <span className="lb-col stat-col">Gigs Done</span>
                        <span className="lb-col stat-col">Referrals</span>
                    </div>

                    <div className="lb-list">
                        {loading ? (
                            [1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="lb-row">
                                    <div className="lb-col rank-col"><div className="lb-skel lb-skel--sm" /></div>
                                    <div className="lb-col student-col">
                                        <div className="lb-skel lb-skel--avatar" />
                                        <div className="lb-skel lb-skel--name" />
                                    </div>
                                    <div className="lb-col stat-col"><div className="lb-skel lb-skel--sm" /></div>
                                    <div className="lb-col stat-col"><div className="lb-skel lb-skel--sm" /></div>
                                </div>
                            ))
                        ) : leaders.map((l) => (
                            <div key={l.rank} className={`lb-row${l.rank === 1 ? ' lb-row--top' : ''}`}>
                                <div className="lb-col rank-col">
                                    <span className="rank-num" style={{ color: rankColors[l.rank - 1] }}>
                                        {l.rank <= 3 && (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill={rankColors[l.rank - 1]} stroke="none">
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                            </svg>
                                        )}
                                        {l.rank}
                                    </span>
                                </div>
                                <div className="lb-col student-col">
                                    <div className="lb-avatar" style={{ '--rank-color': rankColors[l.rank - 1] }}>
                                        {l.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="lb-student-info">
                                        <span className="lb-name">{l.full_name}</span>
                                        <span className="lb-college">{l.referral_code}</span>
                                    </div>
                                </div>
                                <div className="lb-col stat-col"><span className="lb-stat">{l.gigs_completed}</span></div>
                                <div className="lb-col stat-col"><span className="lb-stat">{l.referral_count}</span></div>
                            </div>
                        ))}
                    </div>

                    <div className="lb-footer">
                        <a href="/login" className="lb-viewall">
                            View Full Leaderboard
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

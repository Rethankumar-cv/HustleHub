import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './Hero.css';

// Product preview with REAL live data from Supabase
function ProductMock() {
    const [stats, setStats] = useState({ students: '...', openGigs: '...', hustlers: '...' });

    useEffect(() => {
        const fetchStats = async () => {
            const [{ count: students }, { count: openGigs }, { count: hustlers }] = await Promise.all([
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('gigs').select('*', { count: 'exact', head: true }).eq('status', 'open'),
                supabase.from('users').select('*', { count: 'exact', head: true }).eq('activated', true),
            ]);
            setStats({
                students: (students || 0).toLocaleString(),
                openGigs: (openGigs || 0).toLocaleString(),
                hustlers: (hustlers || 0).toLocaleString(),
            });
        };
        fetchStats();
    }, []);

    return (
        <div className="product-mock">
            {/* Header bar */}
            <div className="mock-topbar">
                <div className="mock-topbar__left">
                    <div className="mock-dot indigo" />
                    <span className="mock-topbar__title">Campus Dashboard</span>
                </div>
                <div className="mock-chip">Live</div>
            </div>

            {/* Real Stats row */}
            <div className="mock-stats">
                <div className="mock-stat">
                    <span className="mock-stat__num">{stats.students}</span>
                    <span className="mock-stat__label">Students</span>
                </div>
                <div className="mock-stat">
                    <span className="mock-stat__num">{stats.openGigs}</span>
                    <span className="mock-stat__label">Open Gigs</span>
                </div>
                <div className="mock-stat">
                    <span className="mock-stat__num">{stats.hustlers}</span>
                    <span className="mock-stat__label">Active Hustlers</span>
                </div>
            </div>

            {/* Section label */}
            <div className="mock-section-label">Trending on Campus</div>

            {/* Generic gig illustrations */}
            <div className="mock-gig">
                <div className="mock-gig__icon icon-design">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
                    </svg>
                </div>
                <div className="mock-gig__body">
                    <div className="mock-gig__title">UI Design for Tech Fest</div>
                    <div className="mock-gig__meta">Figma · Campus Project</div>
                </div>
                <div className="mock-gig__badge badge-open">Open</div>
            </div>

            <div className="mock-gig">
                <div className="mock-gig__icon icon-code">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                    </svg>
                </div>
                <div className="mock-gig__body">
                    <div className="mock-gig__title">Fix React Form Bug</div>
                    <div className="mock-gig__meta">React · Web Dev</div>
                </div>
                <div className="mock-gig__badge badge-progress">In Progress</div>
            </div>

            <div className="mock-gig">
                <div className="mock-gig__icon icon-write">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                </div>
                <div className="mock-gig__body">
                    <div className="mock-gig__title">Write ML Blog Post</div>
                    <div className="mock-gig__meta">Writing · Content</div>
                </div>
                <div className="mock-gig__badge badge-open">Open</div>
            </div>

            {/* Bottom bar - generic */}
            <div className="mock-footer">
                <div className="mock-footer__avatar" />
                <div className="mock-footer__info">
                    <span className="mock-footer__name">Top Campus Hustler</span>
                    <span className="mock-footer__role">Completing gigs across campus</span>
                </div>
                <div className="mock-footer__score">🚀 AI Powered</div>
            </div>
        </div>
    );
}

export default function Hero() {
    return (
        <section className="hero section">
            <div className="container hero__grid">
                {/* Left: Copy */}
                <div className="hero__copy">
                    <div className="hero__eyebrow">
                        <span className="eyebrow-dot" />
                        Campus Micro-Gig Platform
                    </div>

                    <h1 className="hero__headline">
                        Turn Skills Into<br />
                        <span className="headline-accent">Campus Hustle.</span>
                    </h1>

                    <p className="hero__subtext">
                        HustleHub connects students through real micro-gigs. Post what you need.
                        Accept what you can do. Grow your proof.
                    </p>

                    <div className="hero__actions">
                        <a href="/join" className="btn btn-primary hero__btn-primary">
                            Join HustleHub
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </a>
                        <a href="#features" className="btn btn-secondary">
                            Explore Gigs
                        </a>
                    </div>

                    <div className="hero__trust">
                        <div className="trust-avatars">
                            {['A', 'P', 'R', 'S'].map((l, i) => (
                                <div key={i} className="trust-avatar" style={{ '--i': i }}>{l}</div>
                            ))}
                        </div>
                        <p className="trust-text">
                            Joined by <strong>1,200+ students</strong> across campuses
                        </p>
                    </div>
                </div>

                {/* Right: Product mock */}
                <div className="hero__visual">
                    <ProductMock />
                </div>
            </div>
        </section>
    );
}

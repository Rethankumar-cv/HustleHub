import React from 'react';
import './FeatureGrid.css';

const features = [
    {
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M3 9h18M9 21V9" />
            </svg>
        ),
        color: 'indigo',
        title: 'Clean Gig Posting',
        desc: 'Structured gig forms that capture exactly what you need — skill tags, timelines, and scope details in one clean view.',
    },
    {
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
        ),
        color: 'teal',
        title: 'Smart Peer Matching',
        desc: 'Surface the right students for each gig based on skills, past work, and availability — not just proximity.',
    },
    {
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
        ),
        color: 'amber',
        title: 'Referral Growth Loop',
        desc: 'Invite your peers, earn referral credits, and climb the leaderboard. Growth should be earned, not hacked.',
    },
    {
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 20V10" />
                <path d="M12 20V4" />
                <path d="M6 20v-6" />
            </svg>
        ),
        color: 'violet',
        title: 'Admin Insights Dashboard',
        desc: 'A dedicated view for campus managers tracking gig volume, engagement rates, top performers, and platform health.',
    },
];

export default function FeatureGrid() {
    return (
        <section id="features" className="features section">
            <div className="container">
                <div className="section-header centered">
                    <p className="section-eyebrow">Features</p>
                    <h2 className="section-title">Built for Real Campus Growth</h2>
                    <p className="section-desc">
                        Every feature is built around how students actually work — not how enterprise tools assume they do.
                    </p>
                </div>

                <div className="features-grid">
                    {features.map((f, i) => (
                        <div key={i} className={`feature-card feature-card--${f.color}`}>
                            <div className="feature-card__icon">{f.icon}</div>
                            <h3 className="feature-card__title">{f.title}</h3>
                            <p className="feature-card__desc">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

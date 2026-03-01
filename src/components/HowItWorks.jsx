import React from 'react';
import './HowItWorks.css';

const steps = [
    {
        number: '01',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
        ),
        title: 'Post What You Need',
        desc: 'Create a clear gig listing in under two minutes. Describe the task, set a scope, and let the right student find you.',
    },
    {
        number: '02',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
        title: 'Accept and Collaborate',
        desc: 'Browse open gigs that match your skills. Accept work, collaborate directly, and deliver real results for your peers.',
    },
    {
        number: '03',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
        ),
        title: 'Build Your Proof',
        desc: 'Every completed gig adds to your credibility profile. Build a track record that speaks louder than any résumé.',
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="how-it-works section">
            <div className="container">
                <div className="section-header centered">
                    <p className="section-eyebrow">The Process</p>
                    <h2 className="section-title">Simple. Fast. Campus-Driven.</h2>
                    <p className="section-desc">
                        Three steps to go from idea to outcome — no friction, no complexity. Just students helping students.
                    </p>
                </div>

                <div className="hiw-steps">
                    {steps.map((step, i) => (
                        <div key={i} className="hiw-card">
                            <div className="hiw-card__head">
                                <div className="hiw-icon">{step.icon}</div>
                                <span className="hiw-number">{step.number}</span>
                            </div>
                            <h3 className="hiw-card__title">{step.title}</h3>
                            <p className="hiw-card__desc">{step.desc}</p>

                            {i < steps.length - 1 && (
                                <div className="hiw-connector" aria-hidden="true">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <polyline points="19 12 12 19 5 12" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

import React from 'react';
import './Vision.css';

export default function Vision() {
    return (
        <section className="vision section">
            <div className="container">
                <div className="vision__inner">
                    <div className="vision__icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                    </div>
                    <p className="section-eyebrow">Our Mission</p>
                    <h2 className="vision__title">Not Just Gigs. A Campus Economy.</h2>
                    <p className="vision__body">
                        HustleHub is building an internal skill network that empowers students to earn, collaborate,
                        and grow inside their college. We believe every campus is full of untapped talent — students
                        who can design, code, write, research, and more — but lack the structure to connect with peers
                        who actually need those skills.
                    </p>
                    <p className="vision__body">
                        Our platform provides that structure. Not as a freelancing marketplace competing with the internet,
                        but as a focused, trust-driven campus economy where every transaction builds a verifiable track
                        record that students can carry forward into their careers.
                    </p>

                    <div className="vision__metrics">
                        <div className="vision-metric">
                            <span className="vision-metric__num">3x</span>
                            <span className="vision-metric__label">More gigs completed vs solo work</span>
                        </div>
                        <div className="vision-metric__divider" />
                        <div className="vision-metric">
                            <span className="vision-metric__num">1,200+</span>
                            <span className="vision-metric__label">Students onboarded in beta</span>
                        </div>
                        <div className="vision-metric__divider" />
                        <div className="vision-metric">
                            <span className="vision-metric__num">40+</span>
                            <span className="vision-metric__label">Campuses interested in 2025</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

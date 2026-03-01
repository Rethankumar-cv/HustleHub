import React from 'react';
import './CTA.css';

export default function CTA() {
    return (
        <section className="cta section">
            <div className="container">
                <div className="cta__inner">
                    <div className="cta__badge">
                        <span>Free During Beta</span>
                    </div>
                    <h2 className="cta__title">Start Your Hustle Today.</h2>
                    <p className="cta__subtext">Free. Campus-only. Built for students.</p>
                    <div className="cta__actions">
                        <a href="/join" className="btn btn-primary cta__btn">
                            Join HustleHub
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </a>
                    </div>
                    <p className="cta__note">
                        No credit card. No waiting list. Just sign up with your campus email.
                    </p>
                </div>
            </div>
        </section>
    );
}

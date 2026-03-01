import React from 'react';
import './PowModal.css';

export default function PowModal({ isOpen, onClose, card }) {
    if (!isOpen || !card) return null;

    return (
        <div className="pow-modal-overlay" onClick={onClose}>
            <div className="pow-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="pow-modal-close" onClick={onClose}>×</button>

                <div className="pow-modal-header">
                    <div className="pow-modal-badge">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <span>Verified Proof of Work</span>
                    </div>
                </div>

                <div className="pow-modal-body">
                    <h2 className="pow-title">{card.title}</h2>
                    <span className="pow-date">Completed {new Date(card.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>

                    <div className="pow-summary-box">
                        <svg className="pow-quote-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                        </svg>
                        <p className="pow-summary-text">{card.summary}</p>
                    </div>

                    {card.skills_used && card.skills_used.length > 0 && (
                        <div className="pow-skills-section">
                            <h3 className="pow-skills-title">Skills Demonstrated</h3>
                            <div className="pow-skills-grid">
                                {card.skills_used.map(skill => (
                                    <span key={skill} className="pow-skill-pill">{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="pow-modal-footer">
                    <button className="pow-btn-primary" onClick={onClose}>Awesome!</button>
                </div>
            </div>
        </div>
    );
}

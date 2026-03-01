import React from 'react';
import './Footer.css';

const links = {
    Product: ['Features', 'How It Works', 'Leaderboard', 'Pricing'],
    Company: ['About', 'Blog', 'Careers', 'Press'],
    Support: ['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service'],
};

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container footer__inner">
                {/* Brand */}
                <div className="footer__brand">
                    <a href="/" className="footer__logo">
                        <span className="logo-mark">HH</span>
                        <span className="logo-text">HustleHub</span>
                    </a>
                    <p className="footer__desc">
                        The campus micro-gig platform where students earn, collaborate, and build real proof of work.
                    </p>
                    <div className="footer__social">
                        {/* Twitter/X */}
                        <a href="#" aria-label="Twitter" className="social-link">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                            </svg>
                        </a>
                        {/* LinkedIn */}
                        <a href="#" aria-label="LinkedIn" className="social-link">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                                <rect x="2" y="9" width="4" height="12" />
                                <circle cx="4" cy="4" r="2" />
                            </svg>
                        </a>
                        {/* GitHub */}
                        <a href="#" aria-label="GitHub" className="social-link">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                            </svg>
                        </a>
                    </div>
                </div>

                {/* Link columns */}
                {Object.entries(links).map(([group, items]) => (
                    <div key={group} className="footer__col">
                        <h4 className="footer__col-title">{group}</h4>
                        <ul className="footer__col-links">
                            {items.map((item) => (
                                <li key={item}><a href="#">{item}</a></li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="footer__bottom">
                <div className="container footer__bottom-inner">
                    <p className="footer__copy">
                        © {new Date().getFullYear()} HustleHub. All rights reserved.
                    </p>
                    <p className="footer__tagline">Built for students, by students.</p>
                </div>
            </div>
        </footer>
    );
}

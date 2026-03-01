import React, { useState, useEffect } from 'react';
import './Navbar.css';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 16);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
            <div className="container navbar__inner">
                {/* Logo */}
                <a href="/" className="navbar__logo">
                    <span className="logo-mark">HH</span>
                    <span className="logo-text">HustleHub</span>
                </a>

                {/* Desktop Links */}
                <ul className="navbar__links">
                    <li><a href="#features">Features</a></li>
                    <li><a href="#how-it-works">How It Works</a></li>
                    <li><a href="#leaderboard">Leaderboard</a></li>
                </ul>

                {/* Actions */}
                <div className="navbar__actions">
                    <a href="/login" className="navbar__login">Log in</a>
                    <a href="/join" className="btn btn-primary navbar__cta">Join Now</a>
                </div>

                {/* Mobile toggle */}
                <button
                    className="navbar__toggle"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    <span className={`toggle-icon${menuOpen ? ' open' : ''}`}>
                        <span /><span /><span />
                    </span>
                </button>
            </div>

            {/* Mobile menu */}
            <div className={`navbar__mobile${menuOpen ? ' open' : ''}`}>
                <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
                <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a>
                <a href="#leaderboard" onClick={() => setMenuOpen(false)}>Leaderboard</a>
                <a href="/login" onClick={() => setMenuOpen(false)}>Log in</a>
                <a href="/join" className="btn btn-primary" onClick={() => setMenuOpen(false)}>Join Now</a>
            </div>
        </nav>
    );
}

import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AppLayout.css';

export default function AppLayout({ children }) {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/', { replace: true });
    };

    const isAdmin = profile?.role === 'admin';
    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Hustler';
    const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    const navLinks = [
        {
            to: '/dashboard', label: 'Dashboard',
            icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
        },
        {
            to: '/gigs', label: 'Browse Gigs',
            icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" /></svg>
        },
        {
            to: '/post-gig', label: 'Post a Gig',
            icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
        },
        {
            to: '/messages', label: 'Messages',
            icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
        },
        {
            to: '/profile', label: 'My Profile',
            icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        },
        ...(isAdmin ? [{
            to: '/admin', label: 'Admin',
            icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
            admin: true
        }] : []),
    ];

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className={`app-sidebar${sidebarOpen ? ' open' : ''}`}>
                <div className="sidebar-head">
                    <Link to="/" className="sidebar-logo">
                        <span className="logo-mark">HH</span>
                        <span className="logo-text">HustleHub</span>
                    </Link>
                    <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navLinks.map(link => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}${link.admin ? ' sidebar-link--admin' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="sidebar-link__icon">{link.icon}</span>
                            <span className="sidebar-link__label">{link.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-foot">
                    <div className="sidebar-user">
                        <div className="sidebar-avatar">{initials}</div>
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name">{displayName}</span>
                            <span className="sidebar-user-role">{profile?.role ?? 'user'}</span>
                        </div>
                    </div>
                    <button className="sidebar-signout" onClick={handleSignOut} title="Sign out">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

            {/* Main area */}
            <div className="app-main">
                {/* Topbar (mobile) */}
                <header className="app-topbar">
                    <button className="topbar-menu" onClick={() => setSidebarOpen(true)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                    </button>
                    <Link to="/" className="sidebar-logo">
                        <span className="logo-mark">HH</span>
                        <span className="logo-text">HustleHub</span>
                    </Link>
                    <div className="topbar-avatar">{initials}</div>
                </header>

                {/* Page content */}
                <main className="app-content">
                    {children}
                </main>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import './AdminPage.css';

export default function AdminPage() {
    const { profile } = useAuth();
    const [stats, setStats] = useState({ users: 0, gigs: 0, open: 0, completed: 0 });
    const [users, setUsers] = useState([]);
    const [gigs, setGigs] = useState([]);
    const [tab, setTab] = useState('users');
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(null);

    if (profile && profile.role !== 'admin') return <Navigate to="/dashboard" replace />;

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            const [{ data: usersData }, { data: gigsData }] = await Promise.all([
                supabase.from('users').select('*').order('created_at', { ascending: false }),
                supabase.from('gigs').select('*, poster:posted_by(full_name)').order('created_at', { ascending: false })
            ]);
            const u = usersData || [];
            const g = gigsData || [];
            setUsers(u);
            setGigs(g);
            setStats({
                users: u.length,
                gigs: g.length,
                open: g.filter(x => x.status === 'open').length,
                completed: g.filter(x => x.status === 'completed').length,
            });
            setLoading(false);
        };
        fetchAll();
    }, []);

    const toggleActivated = async (u) => {
        setToggling(u.id);
        await supabase.from('users').update({ activated: !u.activated }).eq('id', u.id);
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, activated: !x.activated } : x));
        setToggling(null);
    };

    const makeAdmin = async (u) => {
        setToggling(u.id + '_role');
        const newRole = u.role === 'admin' ? 'user' : 'admin';
        await supabase.from('users').update({ role: newRole }).eq('id', u.id);
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
        setToggling(null);
    };

    const statsCards = [
        { label: 'Total Users', value: stats.users, color: 'indigo' },
        { label: 'Total Gigs', value: stats.gigs, color: 'teal' },
        { label: 'Open Gigs', value: stats.open, color: 'amber' },
        { label: 'Completed', value: stats.completed, color: 'green' },
    ];

    return (
        <AppLayout>
            <div className="page-header">
                <h1 className="page-title">Admin Dashboard</h1>
                <p className="page-subtitle">Platform insights, user management, and gig oversight.</p>
            </div>

            {/* Stats */}
            <div className="admin-stats">
                {statsCards.map(s => (
                    <div key={s.label} className={`admin-stat admin-stat--${s.color}`}>
                        <span className="admin-stat__num">{loading ? '—' : s.value}</span>
                        <span className="admin-stat__label">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="gig-tabs" style={{ marginBottom: 'var(--space-5)' }}>
                <button className={`gig-tab${tab === 'users' ? ' active' : ''}`} onClick={() => setTab('users')}>Users ({users.length})</button>
                <button className={`gig-tab${tab === 'gigs' ? ' active' : ''}`} onClick={() => setTab('gigs')}>Gigs ({gigs.length})</button>
            </div>

            {loading ? <div className="admin-loading">Loading data…</div> : (
                <>
                    {/* Users table */}
                    {tab === 'users' && (
                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Gigs</th>
                                        <th>Refs</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td className="td-name">{u.full_name}</td>
                                            <td className="td-muted">{u.email}</td>
                                            <td>
                                                <span className={`role-badge role-badge--${u.role}`}>{u.role}</span>
                                            </td>
                                            <td className="td-center">{u.gigs_completed}</td>
                                            <td className="td-center">{u.referral_count}</td>
                                            <td>
                                                <span className={`act-badge ${u.activated ? 'act-badge--on' : 'act-badge--off'}`}>
                                                    {u.activated ? 'Active' : 'Pending'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="admin-actions">
                                                    <button
                                                        className={`admin-btn ${u.activated ? 'admin-btn--warn' : 'admin-btn--ok'}`}
                                                        onClick={() => toggleActivated(u)}
                                                        disabled={toggling === u.id}
                                                    >
                                                        {toggling === u.id ? '…' : u.activated ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button
                                                        className={`admin-btn ${u.role === 'admin' ? 'admin-btn--warn' : 'admin-btn--neutral'}`}
                                                        onClick={() => makeAdmin(u)}
                                                        disabled={toggling === u.id + '_role'}
                                                    >
                                                        {toggling === u.id + '_role' ? '…' : u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Gigs table */}
                    {tab === 'gigs' && (
                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Posted By</th>
                                        <th>Status</th>
                                        <th>Tags</th>
                                        <th>Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gigs.map(g => (
                                        <tr key={g.id}>
                                            <td className="td-name">{g.title}</td>
                                            <td className="td-muted">{g.poster?.full_name || '—'}</td>
                                            <td>
                                                <span className={`status-pill status-pill--${g.status}`}>
                                                    {g.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="td-muted">{g.skill_tags?.join(', ') || '—'}</td>
                                            <td className="td-muted">{new Date(g.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </AppLayout>
    );
}

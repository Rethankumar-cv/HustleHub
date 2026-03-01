import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './AuthCard.css';

export default function LoginPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [globalError, setGlobalError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setErrors(prev => ({ ...prev, [e.target.name]: '' }));
        setGlobalError('');
    };

    const validate = () => {
        const errs = {};
        if (!form.email.trim()) errs.email = 'Email is required.';
        if (!form.password) errs.password = 'Password is required.';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        setGlobalError('');

        const { data, error } = await supabase.auth.signInWithPassword({
            email: form.email.trim(),
            password: form.password,
        });

        if (error) {
            let msg = error.message;
            if (
                msg.includes('Invalid login credentials') ||
                msg.includes('invalid_credentials')
            ) {
                msg = 'Incorrect email or password. Please try again.';
            } else if (
                msg.includes('Email not confirmed') ||
                msg.includes('email_not_confirmed')
            ) {
                msg = 'Your email is not confirmed yet. Please check your inbox and click the confirmation link, or ask your admin to disable email confirmation.';
            }
            setGlobalError(msg);
            setLoading(false);
            return;
        }

        navigate('/dashboard', { replace: true });
    };

    return (
        <div className="auth-page">
            <Link to="/" className="auth-page__logo">
                <span className="logo-mark">HH</span>
                <span className="logo-text">HustleHub</span>
            </Link>

            <div className="auth-card">
                <div className="auth-card__head">
                    <h1 className="auth-card__title">Welcome back</h1>
                    <p className="auth-card__subtitle">
                        Log in to your HustleHub account to continue.
                    </p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className={`auth-input${errors.email ? ' error' : ''}`}
                            placeholder="you@campus.edu"
                            value={form.email}
                            onChange={handleChange}
                            autoComplete="email"
                        />
                        {errors.email && <span className="auth-field-error">{errors.email}</span>}
                    </div>

                    <div className="auth-field">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="auth-label" htmlFor="password">Password</label>
                            <a
                                href="/forgot-password"
                                style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 500 }}
                            >
                                Forgot password?
                            </a>
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className={`auth-input${errors.password ? ' error' : ''}`}
                            placeholder="Your password"
                            value={form.password}
                            onChange={handleChange}
                            autoComplete="current-password"
                        />
                        {errors.password && <span className="auth-field-error">{errors.password}</span>}
                    </div>

                    {globalError && (
                        <div className="auth-error">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {globalError}
                        </div>
                    )}

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? <><span className="btn-spinner" /> Logging in…</> : 'Log in'}
                    </button>
                </form>

                <div className="auth-card__foot">
                    Don't have an account? <Link to="/join">Join HustleHub</Link>
                </div>
            </div>
        </div>
    );
}

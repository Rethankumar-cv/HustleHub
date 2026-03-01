import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './AuthCard.css';

// Generates a short unique referral code like "ARJ4K2"
function generateReferralCode(name) {
    const prefix = name.replace(/\s+/g, '').slice(0, 3).toUpperCase();
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${suffix}`;
}

export default function JoinPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const refCode = searchParams.get('ref'); // ?ref=XXXXX

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
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
        if (!form.fullName.trim()) errs.fullName = 'Full name is required.';
        if (!form.email.trim()) errs.email = 'Email is required.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.';
        if (!form.password) errs.password = 'Password is required.';
        else if (form.password.length < 8) errs.password = 'At least 8 characters required.';
        if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
        else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        setGlobalError('');

        try {
            // 1. Look up referred_by UUID from referral code (if ?ref= present)
            let referredById = null;
            if (refCode) {
                const { data: referrer } = await supabase
                    .from('users')
                    .select('id')
                    .eq('referral_code', refCode)
                    .single();
                if (referrer) referredById = referrer.id;
            }

            // 2. Generate a referral code for this new user
            const referralCode = generateReferralCode(form.fullName);

            // 3. Sign up via Supabase Auth
            //    All profile fields are passed in user_metadata so the DB trigger
            //    (handle_new_user) can insert them into public.users as SECURITY DEFINER.
            //    This completely avoids the RLS 401 issue.
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: form.email.trim(),
                password: form.password,
                options: {
                    data: {
                        full_name: form.fullName.trim(),
                        referral_code: referralCode,
                        referred_by: referredById ?? null,
                    },
                },
            });

            if (authError) throw authError;

            const userId = authData.user?.id;
            if (!userId) throw new Error('Signup failed. Please try again.');

            // 4. Increment the referrer's referral_count (best-effort, not critical)
            if (referredById) {
                const { data: refUser } = await supabase
                    .from('users')
                    .select('referral_count')
                    .eq('id', referredById)
                    .single();
                if (refUser) {
                    await supabase
                        .from('users')
                        .update({ referral_count: (refUser.referral_count || 0) + 1 })
                        .eq('id', referredById);
                }
            }

            // 5. Redirect to dashboard
            navigate('/dashboard', { replace: true });

        } catch (err) {
            setGlobalError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <Link to="/" className="auth-page__logo">
                <span className="logo-mark">HH</span>
                <span className="logo-text">HustleHub</span>
            </Link>

            <div className="auth-card">
                <div className="auth-card__head">
                    <h1 className="auth-card__title">Create your account</h1>
                    <p className="auth-card__subtitle">
                        Join the campus hustle. Start earning and building your proof of work.
                    </p>
                </div>

                {/* Referral notice if ?ref= present */}
                {refCode && (
                    <div className="auth-card__ref-notice">
                        <span className="ref-notice-dot" />
                        <span className="ref-notice-text">
                            You were referred! Your connection gets credit when you join.
                        </span>
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="fullName">Full Name</label>
                        <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            className={`auth-input${errors.fullName ? ' error' : ''}`}
                            placeholder="Arjun Sharma"
                            value={form.fullName}
                            onChange={handleChange}
                            autoComplete="name"
                        />
                        {errors.fullName && <span className="auth-field-error">{errors.fullName}</span>}
                    </div>

                    <div className="auth-field">
                        <label className="auth-label" htmlFor="email">Campus Email</label>
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
                        <label className="auth-label" htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className={`auth-input${errors.password ? ' error' : ''}`}
                            placeholder="Minimum 8 characters"
                            value={form.password}
                            onChange={handleChange}
                            autoComplete="new-password"
                        />
                        {errors.password && <span className="auth-field-error">{errors.password}</span>}
                    </div>

                    <div className="auth-field">
                        <label className="auth-label" htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            className={`auth-input${errors.confirmPassword ? ' error' : ''}`}
                            placeholder="Re-enter your password"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            autoComplete="new-password"
                        />
                        {errors.confirmPassword && <span className="auth-field-error">{errors.confirmPassword}</span>}
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
                        {loading ? <><span className="btn-spinner" /> Creating account…</> : 'Join HustleHub'}
                    </button>
                </form>

                <div className="auth-card__foot">
                    Already have an account? <Link to="/login">Log in</Link>
                </div>
            </div>
        </div>
    );
}

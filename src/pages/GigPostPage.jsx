import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './GigPostPage.css';

const PREDEFINED_SKILLS = [
    'React', 'Python', 'Figma', 'UI/UX', 'Node.js', 'Machine Learning',
    'Content Writing', 'Video Editing', 'Data Analysis', 'Java', 'Flutter',
    'DevOps', 'Photography', 'Copywriting', 'Research', 'Excel / Sheets'
];

export default function GigPostPage() {
    const { user, fetchProfile } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        title: '',
        budget: '',
        deadline: '',
        description: '',
        skill_tags: []
    });
    const [customSkill, setCustomSkill] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Scroll to top on step change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step, success]);

    const toggleTag = (tag) => {
        setForm(prev => {
            const isSelected = prev.skill_tags.includes(tag);
            if (isSelected) {
                return { ...prev, skill_tags: prev.skill_tags.filter(t => t !== tag) };
            } else {
                if (prev.skill_tags.length >= 5) return prev;
                return { ...prev, skill_tags: [...prev.skill_tags, tag] };
            }
        });
    };

    const handleAddCustomSkill = (e) => {
        e.preventDefault();
        const tag = customSkill.trim();
        if (!tag) return;
        if (form.skill_tags.includes(tag)) {
            setCustomSkill('');
            return;
        }
        if (form.skill_tags.length < 5) {
            setForm(prev => ({ ...prev, skill_tags: [...prev.skill_tags, tag] }));
        }
        setCustomSkill('');
    };

    const validate = () => {
        const errs = {};
        if (!form.title.trim()) errs.title = 'Title is required.';
        else if (form.title.trim().length < 5) errs.title = 'Title must be at least 5 characters.';

        if (!form.budget) errs.budget = 'Budget is required.';
        else if (isNaN(form.budget) || Number(form.budget) <= 0) errs.budget = 'Enter a valid numeric budget.';

        if (!form.description.trim()) errs.description = 'Description is required.';
        else if (form.description.trim().length < 20) errs.description = 'Description must be at least 20 characters.';

        if (form.skill_tags.length === 0) errs.skill_tags = 'Select at least one skill.';

        return errs;
    };

    const handleContinue = () => {
        const errs = validate();
        if (Object.keys(errs).length) {
            setErrors(errs);
            // Soft warning if budget is empty was requested, but we made it required. 
            // We can scroll to first error visually, but for now just showing them is fine.
            return;
        }
        setErrors({});
        setStep(2);
    };

    const handleAiImprove = () => {
        if (!form.description.trim()) {
            setForm(p => ({ ...p, description: 'Looking for a talented student to help me with this project. Expected deliverables include:\n• \n• \n\nTimeline is flexible. Please have experience with relevant tools.' }));
            return;
        }

        // Mock AI Improvement
        let improved = form.description;
        if (!improved.includes('deliverables') && !improved.includes('•')) {
            improved += '\n\nExpected output:\n• Clear deliverables\n• Timely communication';
        }
        setForm(p => ({ ...p, description: improved }));
    };

    const handleSubmit = async () => {
        setLoading(true);

        // Budget and Deadline must be embedded in description as they don't exist in the gigs schema
        let finalDescription = form.description.trim();
        finalDescription += `\n\n**Budget:** ₹${form.budget}`;
        if (form.deadline) {
            finalDescription += `\n**Deadline:** ${new Date(form.deadline).toLocaleDateString()}`;
        }

        const { error } = await supabase.from('gigs').insert({
            title: form.title.trim(),
            description: finalDescription,
            skill_tags: form.skill_tags,
            posted_by: user.id,
            status: 'open',
        });

        if (error) {
            setErrors({ global: error.message });
            setLoading(false);
        } else {
            // Update user to active
            await supabase.from('users').update({ activated: true }).eq('id', user.id);
            if (fetchProfile) fetchProfile(user.id); // Refresh profile if possible

            setLoading(false);
            setSuccess(true);
        }
    };

    // Derived states for UI
    const budgetWarning = !form.budget && Object.keys(errors).length === 0 && form.title.length > 5;

    if (success) {
        return (
            <AppLayout>
                <div className="gig-post-container">
                    <div className="success-modal">
                        <div className="success-icon-large">
                            🎉
                        </div>
                        <h2 className="success-title">Your Gig is Live!</h2>
                        <div className="activation-badge">✅ You're now an Active Hustler</div>
                        <p className="success-subtitle">Students can now view and apply to your task.</p>

                        <div className="success-actions">
                            <button className="btn-insta-primary" onClick={() => navigate('/gigs')}>Browse Responses</button>
                            <button className="btn-insta-secondary" onClick={() => {
                                navigator.clipboard.writeText(window.location.origin + '/gigs');
                                alert('Link copied to clipboard!');
                            }}>Share Gig</button>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="gig-post-container">

                {/* Header */}
                <div className="gig-page-header">
                    <div className="header-titles">
                        <h1>Create a New Gig</h1>
                        <p>Describe what you need and connect with the right campus hustler.</p>
                    </div>
                    <div className="step-indicator">
                        <span className="step-text">Step {step} of 2</span>
                        <div className="step-bar">
                            <div className="step-progress" style={{ width: step === 1 ? '50%' : '100%' }}></div>
                        </div>
                        <span className="step-labels">{step === 1 ? 'Basic Info' : 'Review'}</span>
                    </div>
                </div>

                {errors.global && <div className="error-banner">{errors.global}</div>}

                {step === 1 && (
                    <div className="gig-form-layout">
                        {/* Form Column */}
                        <div className="form-column">
                            {/* Section 1: Basic Info */}
                            <div className="form-card">
                                <div className="form-group">
                                    <label>Gig Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Design a poster for college tech fest"
                                        className={`insta-input ${errors.title ? 'is-invalid' : ''}`}
                                        value={form.title}
                                        maxLength={120}
                                        onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setErrors(p => ({ ...p, title: '' })); }}
                                    />
                                    <div className="field-footer">
                                        <span className="error-text">{errors.title}</span>
                                        <span className="char-count">{form.title.length}/120</span>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group half">
                                        <label>Budget</label>
                                        <div className="input-with-prefix">
                                            <span className="prefix">₹</span>
                                            <input
                                                type="number"
                                                placeholder="500"
                                                className={`insta-input ${errors.budget ? 'is-invalid' : ''}`}
                                                value={form.budget}
                                                onChange={e => { setForm(p => ({ ...p, budget: e.target.value })); setErrors(p => ({ ...p, budget: '' })); }}
                                            />
                                        </div>
                                        {errors.budget ? (
                                            <div className="field-footer"><span className="error-text">{errors.budget}</span></div>
                                        ) : budgetWarning ? (
                                            <div className="field-footer"><span className="warning-text">Budget required to post</span></div>
                                        ) : (
                                            <div className="budget-suggestions">
                                                Small task: ₹200–500 • Medium task: ₹500–1500
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-group half">
                                        <label>Deadline <span className="label-optional">(Optional)</span></label>
                                        <input
                                            type="date"
                                            className="insta-input"
                                            value={form.deadline}
                                            onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div className="label-row">
                                        <label>Description</label>
                                        <button type="button" className="btn-ai-assist" onClick={handleAiImprove}>
                                            ✨ Improve Description
                                        </button>
                                    </div>
                                    <textarea
                                        placeholder="Explain what you need, expected output, tools required, timeline..."
                                        className={`insta-textarea ${errors.description ? 'is-invalid' : ''}`}
                                        rows={6}
                                        maxLength={1000}
                                        value={form.description}
                                        onChange={e => { setForm(p => ({ ...p, description: e.target.value })); setErrors(p => ({ ...p, description: '' })); }}
                                    />
                                    <div className="field-footer">
                                        <span className="error-text">{errors.description}</span>
                                        <span className="char-count">{form.description.length}/1000</span>
                                    </div>
                                    <div className="helper-tip">💡 Clear descriptions get accepted faster.</div>
                                </div>
                            </div>

                            {/* Section 2: Skill Tags */}
                            <div className="form-card">
                                <h3>Select Required Skills</h3>
                                <p className="section-subtitle">Choose up to 5 skills needed for this gig.</p>

                                <div className="skills-container">
                                    {PREDEFINED_SKILLS.map(tag => {
                                        const isSelected = form.skill_tags.includes(tag);
                                        return (
                                            <button
                                                key={tag}
                                                type="button"
                                                className={`skill-pill ${isSelected ? 'selected' : ''}`}
                                                onClick={() => toggleTag(tag)}
                                            >
                                                {tag}
                                            </button>
                                        )
                                    })}
                                    {form.skill_tags.filter(t => !PREDEFINED_SKILLS.includes(t)).map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            className="skill-pill selected custom-pill"
                                            onClick={() => toggleTag(tag)}
                                        >
                                            {tag} ✕
                                        </button>
                                    ))}
                                </div>
                                {errors.skill_tags && <div className="error-text mt-2">{errors.skill_tags}</div>}

                                <div className="custom-skill-adder">
                                    <span className="custom-prompt">Can't find a skill?</span>
                                    <form onSubmit={handleAddCustomSkill} className="custom-skill-form">
                                        <input
                                            type="text"
                                            placeholder="Type to add custom..."
                                            value={customSkill}
                                            onChange={e => setCustomSkill(e.target.value)}
                                            className="custom-skill-input"
                                        />
                                        <button type="submit" className="custom-skill-btn">Add</button>
                                    </form>
                                </div>
                            </div>

                            <div className="form-actions-sticky">
                                <button className="btn-insta-primary full-width" onClick={handleContinue}>
                                    Continue to Review
                                </button>
                            </div>
                        </div>

                        {/* Preview Panel Column (Desktop) */}
                        <div className="preview-column">
                            <div className="preview-card-sticky">
                                <div className="preview-header">
                                    <h4>Your Gig Preview</h4>
                                    <span className="status-badge open">Open</span>
                                </div>
                                <div className="preview-content">
                                    <h2 className="prev-title">{form.title || 'Gig Title...'}</h2>
                                    <div className="prev-meta">
                                        <span className="prev-budget">₹{form.budget || '0'}</span>
                                        {form.deadline && <span className="prev-deadline">📅 {new Date(form.deadline).toLocaleDateString()}</span>}
                                    </div>
                                    <p className="prev-desc">
                                        {form.description
                                            ? (form.description.length > 150 ? form.description.substring(0, 150) + '...' : form.description)
                                            : 'Description snippet will appear here...'}
                                    </p>
                                    <div className="prev-skills">
                                        {form.skill_tags.length > 0
                                            ? form.skill_tags.map(tag => <span key={tag} className="prev-tag">{tag}</span>)
                                            : <span className="prev-tag empty">Skills...</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="review-layout">
                        <div className="review-card">
                            <h2 className="review-title">Review & Confirm</h2>
                            <p className="review-subtitle">Make sure everything looks good before posting.</p>

                            <div className="review-details">
                                <div className="review-detail-group">
                                    <label>Gig Title</label>
                                    <div className="review-value-large">{form.title}</div>
                                </div>

                                <div className="review-row">
                                    <div className="review-detail-group">
                                        <label>Budget</label>
                                        <div className="review-value highlight">₹{form.budget}</div>
                                    </div>
                                    <div className="review-detail-group">
                                        <label>Deadline</label>
                                        <div className="review-value">
                                            {form.deadline ? new Date(form.deadline).toLocaleDateString() : 'No deadline'}
                                        </div>
                                    </div>
                                </div>

                                <div className="review-detail-group">
                                    <label>Required Skills</label>
                                    <div className="skills-container unclickable">
                                        {form.skill_tags.map(tag => (
                                            <span key={tag} className="skill-pill selected">{tag}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="review-detail-group">
                                    <label>Description</label>
                                    <div className="review-value text-box">
                                        {form.description.split('\n').map((line, i) => (
                                            <React.Fragment key={i}>
                                                {line}
                                                <br />
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="review-actions">
                                <button className="btn-insta-secondary" onClick={() => setStep(1)} disabled={loading}>
                                    Back to Edit
                                </button>
                                <button className="btn-insta-primary" onClick={handleSubmit} disabled={loading}>
                                    {loading ? <span className="spinner"></span> : 'Post Gig'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

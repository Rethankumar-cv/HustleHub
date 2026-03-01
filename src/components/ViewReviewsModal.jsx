import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './ViewReviewsModal.css';

function timeAgo(date) {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}

export default function ViewReviewsModal({ isOpen, onClose, userId, userName }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !userId) return;

        const fetchReviews = async () => {
            setLoading(true);
            const { data: revs, error: revErr } = await supabase
                .from('reviews')
                .select('id, rating, review_text, created_at, reviewer_id')
                .eq('reviewed_user_id', userId)
                .order('created_at', { ascending: false });

            if (revErr || !revs) {
                console.error('Error fetching reviews:', revErr);
                setLoading(false);
                return;
            }

            // Fetch reviewer names manually due to auth.users FK
            const reviewerIds = [...new Set(revs.map(r => r.reviewer_id))];
            let nameMap = {};

            if (reviewerIds.length > 0) {
                const { data: usersData } = await supabase
                    .from('users')
                    .select('id, full_name')
                    .in('id', reviewerIds);

                if (usersData) {
                    usersData.forEach(u => { nameMap[u.id] = u.full_name; });
                }
            }

            const enriched = revs.map(r => ({
                ...r,
                reviewerName: nameMap[r.reviewer_id] || 'Anonymous Hustler'
            }));

            setReviews(enriched);
            setLoading(false);
        };

        fetchReviews();
    }, [isOpen, userId]);

    if (!isOpen) return null;

    return (
        <div className="vr-modal-overlay" onClick={onClose}>
            <div className="vr-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="vr-modal-header">
                    <h2>Reviews for {userName || 'Hustler'}</h2>
                    <button className="vr-modal-close" onClick={onClose}>×</button>
                </div>

                <div className="vr-modal-body">
                    {loading ? (
                        <div className="vr-loading">Loading reviews...</div>
                    ) : reviews.length === 0 ? (
                        <div className="vr-empty">No reviews yet.</div>
                    ) : (
                        <div className="vr-list">
                            {reviews.map(review => (
                                <div key={review.id} className="vr-card">
                                    <div className="vr-card-top">
                                        <div className="vr-reviewer-info">
                                            <div className="vr-avatar">
                                                {review.reviewerName[0].toUpperCase()}
                                            </div>
                                            <span className="vr-name">{review.reviewerName}</span>
                                        </div>
                                        <span className="vr-date">{timeAgo(review.created_at)}</span>
                                    </div>
                                    <div className="vr-stars">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <svg
                                                key={star}
                                                width="14" height="14" viewBox="0 0 24 24"
                                                fill={star <= review.rating ? "#F59E0B" : "none"}
                                                stroke={star <= review.rating ? "#F59E0B" : "#D1D5DB"}
                                                strokeWidth="2"
                                            >
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                            </svg>
                                        ))}
                                    </div>
                                    {review.review_text && (
                                        <p className="vr-text">{review.review_text}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

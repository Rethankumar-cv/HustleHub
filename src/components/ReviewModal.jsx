import React, { useState } from 'react';
import './ReviewModal.css';

export default function ReviewModal({ isOpen, onClose, onSubmit, gig, workerName, isSubmitting }) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (rating === 0) {
            setError('Please select a star rating.');
            return;
        }

        onSubmit({ rating, reviewText });
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setRating(0);
            setHoverRating(0);
            setReviewText('');
            setError('');
            onClose();
        }
    };

    return (
        <div className="review-modal-overlay" onClick={handleClose}>
            <div className="review-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="review-modal-close" onClick={handleClose} disabled={isSubmitting}>×</button>

                <h2 className="review-modal-title">Complete & Review</h2>
                <p className="review-modal-subtitle">
                    How was your experience working with <strong>{workerName || 'this hustler'}</strong> on "{gig?.title}"?
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="review-stars-container">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className={`review-star-btn ${(hoverRating || rating) >= star ? 'active' : ''}`}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                disabled={isSubmitting}
                            >
                                <svg
                                    width="40"
                                    height="40"
                                    viewBox="0 0 24 24"
                                    fill={(hoverRating || rating) >= star ? "#F59E0B" : "none"}
                                    stroke={(hoverRating || rating) >= star ? "#F59E0B" : "#D1D5DB"}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                            </button>
                        ))}
                    </div>

                    {error && <div className="review-error">{error}</div>}

                    <div className="review-input-group">
                        <label>Public Review (Optional)</label>
                        <textarea
                            placeholder="Describe what it was like working with them..."
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            disabled={isSubmitting}
                            rows={4}
                        />
                    </div>

                    <div className="review-modal-actions">
                        <button type="button" className="review-btn-cancel" onClick={handleClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className="review-btn-submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

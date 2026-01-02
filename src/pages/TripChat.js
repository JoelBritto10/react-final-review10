import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './TripChat.css';

function TripChat({ currentUser }) {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHost, setIsHost] = useState(false);
  // const [participants, setParticipants] = useState([]); // Not used, uses trip.participants directly
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: ''
  });
  const [replyingToReviewId, setReplyingToReviewId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const reviewsEndRef = useRef(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const trips = JSON.parse(localStorage.getItem('trips')) || [];
    const currentTrip = trips.find(t => t.id === tripId);

    if (!currentTrip) {
      setError('Trip not found');
      setLoading(false);
      return;
    }

    const isParticipant = currentTrip.participants && currentTrip.participants.includes(currentUser.id);
    const isHostUser = currentTrip.hostId === currentUser.id;

    if (!isParticipant && !isHostUser) {
      setError('Access denied: You are not a member of this trip');
      setLoading(false);
      return;
    }

    setTrip(currentTrip);
    setIsHost(isHostUser);

    // const users = JSON.parse(localStorage.getItem('users')) || [];
    // const tripParticipantIds = [currentTrip.hostId, ...(currentTrip.participants || [])];
    // const tripParticipants = users.filter(u => tripParticipantIds.includes(u.id));
    // setParticipants(tripParticipants); // Not used, commented out

    // Load reviews for this trip
    const allReviews = JSON.parse(localStorage.getItem('tripReviews')) || {};
    const tripReviewsData = allReviews[tripId] || [];
    setReviews(tripReviewsData);

    setLoading(false);
  }, [tripId, currentUser, navigate]);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'star filled' : 'star'}>★</span>
      );
    }
    return stars;
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.comment.trim()) {
      alert('Please fill in all fields');
      return;
    }

    const review = {
      id: Date.now().toString(),
      userId: currentUser.id,
      username: currentUser.username,
      rating: formData.rating,
      title: formData.title.trim(),
      comment: formData.comment.trim(),
      timestamp: new Date().toISOString(),
      hostReplies: []
    };

    const allReviews = JSON.parse(localStorage.getItem('tripReviews')) || {};
    if (!allReviews[tripId]) {
      allReviews[tripId] = [];
    }
    allReviews[tripId].push(review);
    localStorage.setItem('tripReviews', JSON.stringify(allReviews));

    // Sentiment analysis function
    const analyzeSentiment = (text) => {
      const lowerText = text.toLowerCase();
      
      // Positive words
      const positiveWords = [
        'excellent', 'amazing', 'wonderful', 'fantastic', 'great', 'awesome',
        'loved', 'perfect', 'best', 'beautiful', 'outstanding', 'incredible',
        'professional', 'helpful', 'friendly', 'kind', 'thoughtful', 'organized',
        'well-planned', 'smooth', 'enjoyable', 'memorable', 'unforgettable',
        'impressed', 'satisfied', 'recommend', 'worthy', 'special', 'unique'
      ];
      
      // Negative words
      const negativeWords = [
        'terrible', 'awful', 'horrible', 'bad', 'poor', 'worst', 'disappointed',
        'disappointing', 'waste', 'waste of time', 'rude', 'unprofessional',
        'disorganized', 'chaotic', 'unprepared', 'unpleasant', 'uncomfortable',
        'regret', 'misleading', 'avoid', 'useless', 'unhelpful', 'careless'
      ];
      
      let positiveCount = 0;
      let negativeCount = 0;
      
      positiveWords.forEach(word => {
        if (lowerText.includes(word)) positiveCount++;
      });
      
      negativeWords.forEach(word => {
        if (lowerText.includes(word)) negativeCount++;
      });
      
      return { positiveCount, negativeCount };
    };

    // Calculate karma points based on rating + sentiment
    let karmaPoints = 0;
    const sentiment = analyzeSentiment(formData.title + ' ' + formData.comment);
    
    // Base karma from rating
    if (formData.rating === 5) karmaPoints = 10;
    else if (formData.rating === 4) karmaPoints = 10;
    else if (formData.rating === 3) karmaPoints = 5;
    else if (formData.rating === 2) karmaPoints = 0;
    else if (formData.rating === 1) karmaPoints = -1;

    // Bonus/Penalty based on sentiment (unused variable removed)
    
    if (formData.rating >= 4) {
      // For positive ratings: bonus for positive sentiment
      if (sentiment.positiveCount > 0) {
        karmaPoints += Math.min(sentiment.positiveCount, 5); // Max +5 bonus
      }
      // Penalty if negative words despite high rating
      if (sentiment.negativeCount > 0) {
        karmaPoints -= Math.min(sentiment.negativeCount, 3); // Max -3 penalty
      }
    } else if (formData.rating <= 2) {
      // For negative ratings: penalty for negative sentiment
      if (sentiment.negativeCount > 0) {
        karmaPoints -= Math.min(sentiment.negativeCount, 3); // Max -3 additional penalty
      }
    }

    setReviews([...reviews, review]);
    setFormData({ rating: 5, title: '', comment: '' });
    setShowReviewForm(false);

    // Show success message with sentiment details
    let sentimentLabel = '';
    if (sentiment.positiveCount > sentiment.negativeCount) {
      sentimentLabel = ' (Positive sentiment detected!)';
    } else if (sentiment.negativeCount > sentiment.positiveCount) {
      sentimentLabel = ' (Negative sentiment detected!)';
    }
    
    const karmaSign = karmaPoints > 0 ? '+' : '';
    alert(`Review submitted! ${karmaSign}${karmaPoints} karma points will be calculated${sentimentLabel}`);
  };

  const handleSubmitReply = (reviewId) => {
    if (!replyText.trim()) {
      alert('Please enter a reply');
      return;
    }

    const updatedReviews = reviews.map(review => {
      if (review.id === reviewId) {
        return {
          ...review,
          hostReplies: [
            ...(review.hostReplies || []),
            {
              id: Date.now().toString(),
              hostName: currentUser.username,
              hostId: currentUser.id,
              text: replyText.trim(),
              timestamp: new Date().toISOString()
            }
          ]
        };
      }
      return review;
    });

    const allReviews = JSON.parse(localStorage.getItem('tripReviews')) || {};
    allReviews[tripId] = updatedReviews;
    localStorage.setItem('tripReviews', JSON.stringify(allReviews));

    setReviews(updatedReviews);
    setReplyingToReviewId(null);
    setReplyText('');
  };

  if (loading) {
    return (
      <div className="amazon-review-container">
        <div className="loading">Loading reviews...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="amazon-review-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => navigate('/feedback')}>← Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="amazon-review-container">
      <div className="review-page">
        {/* Header */}
        <div className="review-header">
          <button onClick={() => navigate('/feedback')} className="back-link">← Back to Feedback</button>
          <h1>{trip?.title} - Reviews</h1>
          <p className="trip-location">📍 {trip?.location}</p>
        </div>

        {/* Write Review Section - Only for participants after trip ends */}
        {!isHost && trip?.ended && (
          <div className="write-review-section">
            {!showReviewForm ? (
              <button 
                className="write-review-btn"
                onClick={() => setShowReviewForm(true)}
              >
                ✏️ Write a Review
              </button>
            ) : (
              <div className="review-form">
                <h3>Share Your Experience</h3>
                <form onSubmit={handleSubmitReview}>
                  <div className="form-group">
                    <label>Rating</label>
                    <div className="star-rating">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          className={`star-btn ${formData.rating >= star ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, rating: star })}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <span className="rating-text">{formData.rating} out of 5 stars</span>
                  </div>

                  <div className="form-group">
                    <label>Review Title</label>
                    <input
                      type="text"
                      placeholder="Sum up your experience in one sentence"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      maxLength="100"
                    />
                    <span className="char-count">{formData.title.length}/100</span>
                  </div>

                  <div className="form-group">
                    <label>Your Review</label>
                    <textarea
                      placeholder="What did you like or dislike? What did you experience?"
                      value={formData.comment}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                      maxLength="1000"
                      rows="5"
                    />
                    <span className="char-count">{formData.comment.length}/1000</span>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-submit">Submit Review</button>
                    <button 
                      type="button" 
                      className="btn-cancel"
                      onClick={() => setShowReviewForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Message when trip is still active */}
        {!isHost && !trip?.ended && (
          <div className="trip-active-message">
            <p>⏳ This trip is still ongoing. Reviews will be available after the trip ends.</p>
          </div>
        )}

        {/* Reviews List */}
        <div className="reviews-list">
          <h2>Reviews ({reviews.length})</h2>

          {reviews.length === 0 ? (
            <div className="no-reviews">
              <p>No reviews yet</p>
              <p className="subtext">Be the first to review this trip!</p>
            </div>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="review-card">
                {/* Review Header */}
                <div className="review-header-section">
                  <div className="reviewer-info">
                    <span className="reviewer-name">{review.username}</span>
                    <span className="review-date">
                      {new Date(review.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="stars">
                    {renderStars(review.rating)}
                  </div>
                </div>

                {/* Review Title and Comment */}
                <h3 className="review-title">{review.title}</h3>
                <p className="review-comment">{review.comment}</p>

                {/* Host Replies */}
                {review.hostReplies && review.hostReplies.length > 0 && (
                  <div className="host-replies">
                    {review.hostReplies.map(reply => (
                      <div key={reply.id} className="host-reply">
                        <div className="reply-header">
                          <span className="host-label">🏠 Host Response</span>
                          <span className="reply-date">{new Date(reply.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="reply-text">{reply.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Host Reply Form */}
                {isHost && (
                  <div className="reply-section">
                    {replyingToReviewId === review.id ? (
                      <div className="reply-form">
                        <textarea
                          placeholder="Write your response..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          maxLength="500"
                          rows="3"
                        />
                        <span className="char-count">{replyText.length}/500</span>
                        <div className="reply-actions">
                          <button 
                            className="btn-reply"
                            onClick={() => handleSubmitReply(review.id)}
                          >
                            Post Reply
                          </button>
                          <button 
                            className="btn-cancel-reply"
                            onClick={() => {
                              setReplyingToReviewId(null);
                              setReplyText('');
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        className="btn-reply-link"
                        onClick={() => setReplyingToReviewId(review.id)}
                      >
                        Reply to Review
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={reviewsEndRef} />
        </div>
      </div>
    </div>
  );
}

export default TripChat;

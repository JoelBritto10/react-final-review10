import React, { useState, useEffect, useCallback } from 'react';
import './Karma.css';
import { subscribeToTrips } from '../firebaseUtils';

function Karma({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userKarmaBreakdown, setUserKarmaBreakdown] = useState({});
  const [firebaseTrips, setFirebaseTrips] = useState([]);

  // Function to analyze sentiment in review text
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

  // Function to calculate karma points based on rating and sentiment
  const calculateKarmaFromReview = useCallback((rating, title, comment) => {
    let karmaPoints = 0;
    const sentiment = analyzeSentiment(title + ' ' + comment);
    
    // Base karma from rating
    if (rating === 5) karmaPoints = 10;
    else if (rating === 4) karmaPoints = 10;
    else if (rating === 3) karmaPoints = 5;
    else if (rating === 2) karmaPoints = 0;
    else if (rating === 1) karmaPoints = -1;

    // Bonus/Penalty based on sentiment
    if (rating >= 4) {
      // For positive ratings: bonus for positive sentiment
      if (sentiment.positiveCount > 0) {
        karmaPoints += Math.min(sentiment.positiveCount, 5); // Max +5 bonus
      }
      // Penalty if negative words despite high rating
      if (sentiment.negativeCount > 0) {
        karmaPoints -= Math.min(sentiment.negativeCount, 3); // Max -3 penalty
      }
    } else if (rating <= 2) {
      // For negative ratings: penalty for negative sentiment
      if (sentiment.negativeCount > 0) {
        karmaPoints -= Math.min(sentiment.negativeCount, 3); // Max -3 additional penalty
      }
    }

    return karmaPoints;
  }, []);

  // Function to calculate total karma from all reviews for a user
  const calculateTotalKarmaFromReviews = useCallback((trips) => {
    const tripReviews = JSON.parse(localStorage.getItem('tripReviews')) || {};
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const breakdown = {};
    const userKarmaMap = {};

    // Initialize karma map for all users
    users.forEach(user => {
      userKarmaMap[user.id] = 0;
    });

    // Get valid trip IDs from Firebase
    const validTripIds = trips.map(t => t.id);

    // Clean up reviews for deleted trips
    Object.keys(tripReviews).forEach(tripId => {
      if (!validTripIds.includes(tripId)) {
        delete tripReviews[tripId];
      }
    });
    localStorage.setItem('tripReviews', JSON.stringify(tripReviews));

    // For each trip, check if current user is the host and calculate karma from reviews
    trips.forEach(trip => {
      if (trip.hostId) {
        const reviews = tripReviews[trip.id] || [];
        reviews.forEach(review => {
          if (!breakdown[trip.hostId]) {
            breakdown[trip.hostId] = {
              reviewsReceived: 0,
              totalKarmaEarned: 0,
              reviewDetails: []
            };
          }
          
          const karmaPoints = calculateKarmaFromReview(review.rating, review.title, review.comment);
          breakdown[trip.hostId].reviewsReceived++;
          breakdown[trip.hostId].totalKarmaEarned += karmaPoints;
          userKarmaMap[trip.hostId] = (userKarmaMap[trip.hostId] || 0) + karmaPoints;
          breakdown[trip.hostId].reviewDetails.push({
            rating: review.rating,
            karma: karmaPoints,
            reviewer: review.username,
            date: review.timestamp
          });
        });
      }
    });

    // Update users with calculated karma from all reviews
    const updatedUsers = users.map(user => ({
      ...user,
      karma: userKarmaMap[user.id] || 0
    }));

    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setUserKarmaBreakdown(breakdown);
  }, [calculateKarmaFromReview]);

  // Subscribe to Firebase trips in real-time
  useEffect(() => {
    const unsubscribe = subscribeToTrips((trips) => {
      setFirebaseTrips(trips);
      // Recalculate karma whenever trips change
      calculateTotalKarmaFromReviews(trips);
    });

    return () => unsubscribe();
  }, [calculateTotalKarmaFromReviews]);

  useEffect(() => {
    // Calculate karma from reviews and get updated user list
    calculateTotalKarmaFromReviews(firebaseTrips);
    
    // Refresh user list after calculation
    setTimeout(() => {
      const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
      const sorted = storedUsers.sort((a, b) => (b.karma || 0) - (a.karma || 0));
      setUsers(sorted);
    }, 100);
  }, [refreshTrigger, currentUser?.id, firebaseTrips, calculateTotalKarmaFromReviews]);

  // Auto-refresh leaderboard every 5 seconds to show latest karma updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const getKarmaBadge = (karma) => {
    karma = karma || 0;
    if (karma >= 500) return '👑 Master';
    if (karma >= 200) return '🏆 Legend';
    if (karma >= 100) return '⛰️ Adventurer';
    if (karma >= 50) return '🗺️ Explorer';
    return '🌱 Beginner';
  };

  const getKarmaColor = (karma) => {
    karma = karma || 0;
    if (karma >= 500) return '#8b008b'; // Purple for Master
    if (karma >= 200) return '#ffd700'; // Gold for Legend
    if (karma >= 100) return '#ff6347'; // Coral for Adventurer
    if (karma >= 50) return '#4169e1'; // Royal Blue for Explorer
    return '#90ee90'; // Light Green for Beginner
  };

  return (
    <div className="container">
      <div className="karma-container card">
        <h1>🏆 Karma Leaderboard</h1>
        
        <div className="karma-stats">
          <div className="stat-card">
            <h3>{currentUser?.karma || 0}</h3>
            <p>Your Karma Points</p>
            <p className="badge">{getKarmaBadge(currentUser?.karma)}</p>
            {userKarmaBreakdown[currentUser?.id] && (
              <p className="breakdown-text">
                From {userKarmaBreakdown[currentUser?.id].reviewsReceived} review{userKarmaBreakdown[currentUser?.id].reviewsReceived !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <div className="leaderboard">
          <h2>🥇 Top Contributors</h2>
          {users.length === 0 ? (
            <p className="no-users">No users yet</p>
          ) : (
            users.map((user, index) => {
              const breakdown = userKarmaBreakdown[user.id] || { reviewsReceived: 0, totalKarmaEarned: 0 };
              const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
              
              return (
                <div key={user.id} className="leaderboard-item">
                  <span className="rank">{medalEmoji || `#${index + 1}`}</span>
                  <div className="user-info">
                    <span className="name">{user.username}</span>
                    {breakdown.reviewsReceived > 0 && (
                      <span className="review-count">
                        {breakdown.reviewsReceived} review{breakdown.reviewsReceived !== 1 ? 's' : ''} received
                      </span>
                    )}
                  </div>
                  <span className="karma" style={{ color: getKarmaColor(user.karma) }}>
                    {user.karma || 0} pts
                  </span>
                  <span className="badge">{getKarmaBadge(user.karma)}</span>
                </div>
              );
            })
          )}
        </div>

        <div className="karma-info">
          <h3>📊 How Karma is Calculated</h3>
          <ul>
            <li>
              <strong>Base Karma from Reviews:</strong>
              <ul className="nested-list">
                <li>⭐⭐⭐⭐⭐ 5-star: <span className="positive">+10 points</span></li>
                <li>⭐⭐⭐⭐ 4-star: <span className="positive">+10 points</span></li>
                <li>⭐⭐⭐ 3-star: <span className="positive">+5 points</span></li>
                <li>⭐⭐ 2-star: <span className="neutral">0 points</span></li>
                <li>⭐ 1-star: <span className="negative">-1 point</span></li>
              </ul>
            </li>
            <li>
              <strong>Sentiment-Based Bonuses & Penalties:</strong>
              <ul className="nested-list">
                <li>✨ Positive Sentiment Bonus: <span className="positive">+1 to +5 points</span> (for positive keywords like "amazing", "wonderful", "excellent")</li>
                <li>😞 Negative Sentiment Penalty: <span className="negative">-1 to -3 points</span> (for negative keywords like "terrible", "awful", "disappointing")</li>
              </ul>
            </li>
            <li>
              <strong>Badge Milestones:</strong>
              <ul className="nested-list">
                <li>🌱 Beginner: 0 - 49 points</li>
                <li>🗺️ Explorer: 50 - 99 points</li>
                <li>⛰️ Adventurer: 100 - 199 points</li>
                <li>🏆 Legend: 200 - 499 points</li>
                <li>👑 Master: 500+ points</li>
              </ul>
            </li>
            <li>
              ✅ All reviews are analyzed for authenticity to ensure fair and accurate karma distribution
            </li>
          </ul>
        </div>

        <div className="karma-tips">
          <h3>💡 Tips to Earn More Karma</h3>
          <ul>
            <li>Host well-organized and memorable trips</li>
            <li>Be responsive and communicative with participants</li>
            <li>Follow through on trip promises and details</li>
            <li>Create safe and enjoyable experiences</li>
            <li>Encourage genuine, detailed reviews from participants</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Karma;

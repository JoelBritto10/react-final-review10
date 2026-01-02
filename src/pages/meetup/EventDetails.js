import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getEvent,
  rsvpToEvent,
  bookmarkEvent,
  unbookmarkEvent,
  subscribeToEventComments,
  addEventComment,
  likeComment,
  replyToComment
} from '../../meetupUtils';
import './EventDetails.css';

function EventDetails({ currentUser }) {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    loadEvent();
    
    // Subscribe to comments
    const unsubscribe = subscribeToEventComments(eventId, (fetchedComments) => {
      setComments(fetchedComments);
    });

    return () => unsubscribe();
    // loadEvent is defined inside the component and uses state setters from useState
    // which are stable across renders, so it doesn't need to be in the dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, currentUser, navigate]);

  const loadEvent = async () => {
    try {
      const eventData = await getEvent(eventId);
      if (!eventData) {
        alert('Event not found');
        navigate('/meetup');
        return;
      }
      
      setEvent(eventData);
      
      // Check RSVP status
      if (eventData.rsvpList?.includes(currentUser.id)) {
        setRsvpStatus('going');
      } else if (eventData.interestedList?.includes(currentUser.id)) {
        setRsvpStatus('interested');
      }
      
      // Check bookmark status
      setIsBookmarked(eventData.bookmarks?.includes(currentUser.id));
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading event:', error);
      setLoading(false);
    }
  };

  const handleRSVP = async (status) => {
    try {
      await rsvpToEvent(eventId, currentUser.id, status);
      setRsvpStatus(status);
      // Reload event to get updated counts
      loadEvent();
    } catch (error) {
      console.error('Error RSVPing:', error);
      alert(error.message || 'Failed to RSVP');
    }
  };

  const handleBookmark = async () => {
    try {
      if (isBookmarked) {
        await unbookmarkEvent(eventId, currentUser.id);
        setIsBookmarked(false);
      } else {
        await bookmarkEvent(eventId, currentUser.id);
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error bookmarking:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await addEventComment(
        eventId,
        currentUser.id,
        currentUser.username || currentUser.displayName,
        currentUser.photoURL || '',
        commentText
      );
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      await likeComment(commentId, currentUser.id);
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleReply = async (commentId) => {
    if (!replyText.trim()) return;

    try {
      await replyToComment(
        commentId,
        currentUser.id,
        currentUser.username || currentUser.displayName,
        currentUser.photoURL || '',
        replyText
      );
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error replying:', error);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading event...</div>;
  }

  if (!event) {
    return <div className="error-container">Event not found</div>;
  }

  const isOrganizer = event.organizerId === currentUser.id;
  const eventDate = new Date(event.date);
  const isPastEvent = eventDate < new Date();

  return (
    <div className="event-details">
      {/* Cover Image */}
      <div 
        className="event-cover"
        style={{ backgroundImage: `url(${event.coverImageURL || '/placeholder-event.jpg'})` }}
      >
        <div className="event-cover-overlay">
          <div className="event-cover-content">
            <span className="event-category-badge">{event.category}</span>
            <h1 className="event-title-large">{event.title}</h1>
            <div className="event-meta-info">
              <span>📅 {eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>⏰ {event.time}</span>
              <span>📍 {event.location?.placeName || event.location?.address}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="event-content-container">
        <div className="event-main-content">
          {/* Event Info */}
          <section className="event-section">
            <h2 className="section-title">About this event</h2>
            <p className="event-description">{event.description}</p>
            
            <div className="event-details-grid">
              <div className="detail-item">
                <span className="detail-label">Duration</span>
                <span className="detail-value">{event.duration} hours</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Price</span>
                <span className="detail-value">
                  {event.price === 0 ? <span className="free-badge">Free</span> : `$${event.price}`}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Attendees</span>
                <span className="detail-value">
                  {event.rsvpList?.length || 0}
                  {event.maxAttendees ? ` / ${event.maxAttendees}` : ''}
                </span>
              </div>
            </div>

            {event.tags && event.tags.length > 0 && (
              <div className="event-tags">
                {event.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </section>

          {/* Organizer Info */}
          <section className="event-section">
            <h2 className="section-title">Organized by</h2>
            <div className="organizer-card">
              <div className="organizer-avatar">
                {event.organizerPhoto ? (
                  <img src={event.organizerPhoto} alt={event.organizerName} />
                ) : (
                  <div className="avatar-placeholder">
                    {event.organizerName?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="organizer-info">
                <h3 className="organizer-name">{event.organizerName}</h3>
                <p className="organizer-meta">Event Organizer</p>
              </div>
            </div>
          </section>

          {/* Comments Section */}
          <section className="event-section">
            <h2 className="section-title">Discussion ({comments.length})</h2>
            
            <form onSubmit={handleAddComment} className="comment-form">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                rows="3"
                className="comment-input"
              />
              <button type="submit" className="comment-submit-btn" disabled={!commentText.trim()}>
                Post Comment
              </button>
            </form>

            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <div className="comment-avatar">
                      {comment.userPhoto ? (
                        <img src={comment.userPhoto} alt={comment.userName} />
                      ) : (
                        <div className="avatar-placeholder-small">
                          {comment.userName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="comment-user-info">
                      <span className="comment-user-name">{comment.userName}</span>
                      <span className="comment-timestamp">
                        {comment.timestamp?.toDate?.()?.toLocaleDateString() || 'Just now'}
                      </span>
                    </div>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                  <div className="comment-actions">
                    <button 
                      onClick={() => handleLikeComment(comment.id)}
                      className={`comment-action-btn ${comment.likes?.includes(currentUser.id) ? 'active' : ''}`}
                    >
                      👍 {comment.likes?.length || 0}
                    </button>
                    <button 
                      onClick={() => setReplyingTo(comment.id)}
                      className="comment-action-btn"
                    >
                      💬 Reply
                    </button>
                  </div>

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div className="reply-form">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        rows="2"
                        className="reply-input"
                      />
                      <div className="reply-actions">
                        <button onClick={() => setReplyingTo(null)} className="btn-cancel-reply">
                          Cancel
                        </button>
                        <button onClick={() => handleReply(comment.id)} className="btn-submit-reply">
                          Reply
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="replies-list">
                      {comment.replies.map((reply, idx) => (
                        <div key={idx} className="reply-item">
                          <div className="reply-avatar">
                            {reply.userPhoto ? (
                              <img src={reply.userPhoto} alt={reply.userName} />
                            ) : (
                              <div className="avatar-placeholder-small">
                                {reply.userName?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="reply-content">
                            <span className="reply-user-name">{reply.userName}</span>
                            <p className="reply-text">{reply.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="event-sidebar">
          <div className="sidebar-sticky">
            {/* RSVP Card */}
            {!isPastEvent && (
              <div className="rsvp-card">
                <h3 className="rsvp-title">Join this event</h3>
                
                <div className="rsvp-buttons">
                  <button
                    onClick={() => handleRSVP('going')}
                    className={`rsvp-btn ${rsvpStatus === 'going' ? 'active' : ''}`}
                  >
                    ✓ Going
                  </button>
                  <button
                    onClick={() => handleRSVP('interested')}
                    className={`rsvp-btn ${rsvpStatus === 'interested' ? 'active' : ''}`}
                  >
                    ★ Interested
                  </button>
                </div>

                <div className="attendee-info">
                  <p><strong>{event.rsvpList?.length || 0}</strong> going</p>
                  <p><strong>{event.interestedList?.length || 0}</strong> interested</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="event-actions-card">
              <button onClick={handleBookmark} className={`action-btn ${isBookmarked ? 'active' : ''}`}>
                {isBookmarked ? '★ Saved' : '☆ Save'}
              </button>
              <button className="action-btn">
                🔗 Share
              </button>
              {isOrganizer && (
                <Link to={`/meetup/edit/${eventId}`} className="action-btn edit-btn">
                  ✏️ Edit Event
                </Link>
              )}
            </div>

            {/* Location Map Placeholder */}
            <div className="location-card">
              <h3 className="location-title">Location</h3>
              <p className="location-name">{event.location?.placeName}</p>
              <p className="location-address">{event.location?.address}</p>
              <div className="map-placeholder">
                <span>🗺️ Map View</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;

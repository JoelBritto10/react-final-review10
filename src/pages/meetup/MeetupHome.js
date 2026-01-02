import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { subscribeToEvents, getEventCategories } from '../../meetupUtils';
import './MeetupHome.css';

function MeetupHome({ currentUser }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Subscribe to events
    const unsubscribe = subscribeToEvents((fetchedEvents) => {
      setEvents(fetchedEvents);
      setLoading(false);
    });

    // Load categories
    getEventCategories().then(setCategories);

    return () => unsubscribe();
  }, [currentUser, navigate]);

  // Get trending events (most RSVPs)
  const trendingEvents = [...events]
    .sort((a, b) => (b.rsvpList?.length || 0) - (a.rsvpList?.length || 0))
    .slice(0, 6);

  // Get recommended events based on user interests
  const recommendedEvents = events
    .filter(event => 
      currentUser.interests?.some(interest => 
        event.category === interest || event.tags?.includes(interest)
      )
    )
    .slice(0, 6);

  // Get user's upcoming events
  const myUpcomingEvents = events.filter(event => 
    event.rsvpList?.includes(currentUser.id) && new Date(event.date) >= new Date()
  );

  const handleSearch = () => {
    navigate(`/meetup/explore?search=${searchQuery}&location=${selectedLocation}`);
  };

  return (
    <div className="meetup-home">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Discover Events Near You</h1>
          <p className="hero-subtitle">
            Connect with people who share your interests. Join meetups, network, and explore.
          </p>
          
          <div className="hero-search">
            <input
              type="text"
              placeholder="Search for events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <input
              type="text"
              placeholder="Location"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="location-input"
            />
            <button onClick={handleSearch} className="search-btn">
              🔍 Search
            </button>
          </div>
          
          <div className="hero-actions">
            <Link to="/meetup/explore" className="btn-primary">
              Explore Events
            </Link>
            <Link to="/meetup/create" className="btn-secondary">
              Create Event
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="loading">Loading events...</div>
      ) : (
        <>
          {/* Your Upcoming Events */}
          {myUpcomingEvents.length > 0 && (
            <section className="events-section">
              <h2 className="section-title">Your Upcoming Events</h2>
              <div className="events-grid">
                {myUpcomingEvents.map(event => (
                  <Link 
                    key={event.id} 
                    to={`/meetup/event/${event.id}`}
                    className="event-card"
                  >
                    <div 
                      className="event-image"
                      style={{ backgroundImage: `url(${event.coverImageURL || '/placeholder-event.jpg'})` }}
                    >
                      <span className="event-category">{event.category}</span>
                    </div>
                    <div className="event-info">
                      <h3 className="event-title">{event.title}</h3>
                      <p className="event-date">
                        📅 {new Date(event.date).toLocaleDateString()} at {event.time}
                      </p>
                      <p className="event-location">📍 {event.location?.placeName || event.location?.address}</p>
                      <div className="event-meta">
                        <span>👥 {event.rsvpList?.length || 0} going</span>
                        {event.price === 0 || event.price === 'free' ? (
                          <span className="event-price-free">Free</span>
                        ) : (
                          <span className="event-price">${event.price}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Trending Events */}
          <section className="events-section">
            <div className="section-header">
              <h2 className="section-title">Trending Events</h2>
              <Link to="/meetup/explore" className="see-all">See all →</Link>
            </div>
            <div className="events-carousel">
              {trendingEvents.map(event => (
                <Link 
                  key={event.id} 
                  to={`/meetup/event/${event.id}`}
                  className="event-card"
                >
                  <div 
                    className="event-image"
                    style={{ backgroundImage: `url(${event.coverImageURL || '/placeholder-event.jpg'})` }}
                  >
                    <span className="event-category">{event.category}</span>
                  </div>
                  <div className="event-info">
                    <h3 className="event-title">{event.title}</h3>
                    <p className="event-date">
                      📅 {new Date(event.date).toLocaleDateString()} at {event.time}
                    </p>
                    <p className="event-location">📍 {event.location?.placeName || event.location?.address}</p>
                    <div className="event-meta">
                      <span>👥 {event.rsvpList?.length || 0} going</span>
                      {event.price === 0 || event.price === 'free' ? (
                        <span className="event-price-free">Free</span>
                      ) : (
                        <span className="event-price">${event.price}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Recommended For You */}
          {recommendedEvents.length > 0 && (
            <section className="events-section">
              <h2 className="section-title">Recommended For You</h2>
              <div className="events-grid">
                {recommendedEvents.map(event => (
                  <Link 
                    key={event.id} 
                    to={`/meetup/event/${event.id}`}
                    className="event-card"
                  >
                    <div 
                      className="event-image"
                      style={{ backgroundImage: `url(${event.coverImageURL || '/placeholder-event.jpg'})` }}
                    >
                      <span className="event-category">{event.category}</span>
                    </div>
                    <div className="event-info">
                      <h3 className="event-title">{event.title}</h3>
                      <p className="event-date">
                        📅 {new Date(event.date).toLocaleDateString()} at {event.time}
                      </p>
                      <p className="event-location">📍 {event.location?.placeName || event.location?.address}</p>
                      <div className="event-meta">
                        <span>👥 {event.rsvpList?.length || 0} going</span>
                        {event.price === 0 || event.price === 'free' ? (
                          <span className="event-price-free">Free</span>
                        ) : (
                          <span className="event-price">${event.price}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Popular Categories */}
          <section className="categories-section">
            <h2 className="section-title">Popular Categories</h2>
            <div className="categories-grid">
              {categories.map(category => (
                <Link
                  key={category.id}
                  to={`/meetup/explore?category=${category.id}`}
                  className="category-card"
                  style={{ borderColor: category.color }}
                >
                  <span className="category-icon">{category.icon}</span>
                  <h3 className="category-name">{category.name}</h3>
                  <p className="category-description">{category.description}</p>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default MeetupHome;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './TripExplore.css';
import { subscribeToTrips } from '../firebaseUtils';

function TripExplore({ currentUser }) {
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'map'
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  // const [availableCategories, setAvailableCategories] = useState([]); // Not used

  // Get user's real-time location
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setLocationError(null);
        },
        (error) => {
          setLocationError('Unable to get location');
          console.log('Location error:', error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Load trips from Firebase (real-time)
  useEffect(() => {
    const unsubscribe = subscribeToTrips((firebaseTrips) => {
      console.log('✅ Loaded trips from Firebase:', firebaseTrips.length);
      setTrips(firebaseTrips);
      setFilteredTrips(firebaseTrips);
      
      // Extract unique categories from trips
      // const uniqueCategories = [...new Set(firebaseTrips.map(trip => trip.category).filter(cat => cat && cat !== 'all'))];
      // const categories = ['all', ...uniqueCategories.sort()];
      // setAvailableCategories(categories); // Not used, commented out
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter and sort trips
  useEffect(() => {
    let results = trips;

    // Filter by search query
    if (searchQuery.trim()) {
      results = results.filter(trip =>
        trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      results = results.filter(trip => trip.category === selectedCategory);
    }

    // Sort
    results.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
        case 'oldest':
          return new Date(a.createdAt || a.date) - new Date(b.createdAt || a.date);
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    setFilteredTrips(results);
  }, [searchQuery, selectedCategory, sortBy, trips]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('newest');
  };

  const getGoogleMapsUrl = () => {
    if (!userLocation) return '';
    return `https://www.google.com/maps?q=${userLocation.lat},${userLocation.lng}&z=16`;
  };

  const getDistanceFromUser = (tripLat, tripLng) => {
    if (!userLocation) return null;
    
    const R = 6371; // Earth's radius in km
    const dLat = (tripLat - userLocation.lat) * Math.PI / 180;
    const dLng = (tripLng - userLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(tripLat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container trip-explore-container">
      {/* Header */}
      <div className="explore-header">
        <h1>🗺️ Explore Trips</h1>
        <p className="header-subtitle">Search, browse, and discover upcoming adventures</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Search Trips
        </button>
        <button
          className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          📍 Trip Map
        </button>
      </div>

      {/* SEARCH TAB */}
      {activeTab === 'search' && (
        <div className="search-tab-content">
          {/* Search Controls */}
          <div className="search-controls">
            {/* Search Bar */}
            <div className="search-bar-container">
              <input
                type="text"
                placeholder="Search by location, title, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-bar"
              />
              <span className="search-icon">🔍</span>
            </div>

            {/* Filters Row */}
            <div className="filters-row">
            </div>
          </div>

          {/* Results Count */}
          <div className="results-header">
            <p className="results-count">
              {filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'} found
            </p>
          </div>

          {/* Trips Grid */}
          {filteredTrips.length > 0 ? (
            <div className="trips-grid">
              {filteredTrips.map((trip) => (
                <div key={trip.id} className="trip-card">
                  <div className="trip-card-image">
                    <div className="trip-category-badge">{trip.category}</div>
                  </div>
                  
                  <div className="trip-card-content">
                    <h3>{trip.title}</h3>
                    <p className="trip-location">📍 {trip.location}</p>
                    <p className="trip-description">{trip.description?.substring(0, 80)}...</p>
                    
                    <div className="trip-info">
                      <span>👥 {trip.participants?.length || 0} joined</span>
                      <span>💰 ₹{trip.budget}</span>
                    </div>

                    <div className="trip-card-actions">
                      <Link to={`/trip-location/${trip.id}`} className="trip-btn-primary">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>No trips match your search criteria.</p>
              <button onClick={handleClearFilters} className="clear-filters-btn">
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* MAP TAB */}
      {activeTab === 'map' && (
        <div className="map-tab-content">
          {/* Real-time Location Feature */}
          <div className="map-info">
            <div className="location-feature-grid">
              <div className="location-card">
                <h3>📍 Your Location</h3>
                {userLocation ? (
                  <>
                    <p>Lat: {userLocation.lat.toFixed(4)}</p>
                    <p>Lng: {userLocation.lng.toFixed(4)}</p>
                    <p className="accuracy">±{userLocation.accuracy.toFixed(0)}m accuracy</p>
                    <a href={getGoogleMapsUrl()} target="_blank" rel="noopener noreferrer" className="maps-link">
                      📱 Open in Google Maps
                    </a>
                  </>
                ) : (
                  <p className="loading-text">Getting your location...</p>
                )}
              </div>

              <div className="location-card">
                <h3>📊 Trip Statistics</h3>
                <p>Total trips: <strong>{trips.length}</strong></p>
                <p>Your trips: <strong>{trips.filter(t => t.createdBy === currentUser?.id).length}</strong></p>
                <p>Joined trips: <strong>{trips.filter(t => t.participants?.includes(currentUser?.id)).length}</strong></p>
              </div>
            </div>

            {locationError && (
              <div className="location-error">
                <p>⚠️ {locationError}</p>
              </div>
            )}
          </div>

          {/* Map View Grid */}
          <div className="map-trips-grid">
            <h3>🗺️ All Trips by Location</h3>
            {trips.length > 0 ? (
              <div className="trips-map-list">
                {trips.map((trip) => (
                  <div key={trip.id} className="trip-map-item">
                    <div className="trip-map-header">
                      <h4>{trip.title}</h4>
                      <span className="trip-category">{trip.category}</span>
                    </div>
                    <p className="trip-location">📍 {trip.location}</p>
                    {userLocation && trip.coordinates && (
                      <p className="trip-distance">
                        📏 {getDistanceFromUser(trip.coordinates.lat, trip.coordinates.lng)} km away
                      </p>
                    )}
                    <p className="trip-participants">👥 {trip.participants?.length || 0} participants</p>
                    <Link to={`/trip-location/${trip.id}`} className="map-view-btn">
                      View on Map
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-trips-text">No trips available to display on map.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TripExplore;

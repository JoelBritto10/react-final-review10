import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthChange, logoutUser, getUserProfile, removeDuplicateTrips } from './firebaseUtils';
import './App.css';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import TripExplore from './pages/TripExplore';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import DestinationChat from './pages/DestinationChat';
import TripChat from './pages/TripChat';
import TripGroupChat from './pages/TripGroupChat';
import Karma from './pages/Karma';
import CreateTrip from './pages/CreateTrip';
import EditTrip from './pages/EditTrip';
import TripReview from './pages/TripReview';
import Feedback from './pages/Feedback';
import TripLocationMap from './pages/TripLocationMap';
import TripSuggestions from './pages/TripSuggestions';
// Meetup Pages
import MeetupHome from './pages/meetup/MeetupHome';
import CreateEvent from './pages/meetup/CreateEvent';
import EventDetails from './pages/meetup/EventDetails';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Run deduplication once on app initialization
  useEffect(() => {
    const deduplicateOnce = async () => {
      try {
        await removeDuplicateTrips();
      } catch (error) {
        console.error('Error during deduplication:', error);
      }
    };
    deduplicateOnce();
  }, []);

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get user profile from Firestore
          const userProfile = await getUserProfile(firebaseUser.uid);
          
          const userData = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            username: userProfile?.username || firebaseUser.displayName || firebaseUser.email.split('@')[0],
            karma: userProfile?.karma || 0,
            ...(userProfile || {})
          };
          setCurrentUser(userData);
          setIsAuthenticated(true);
          localStorage.setItem('currentUser', JSON.stringify(userData));
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('currentUser');
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Router>
      <div className="App">
        {isAuthenticated && <Navbar onLogout={handleLogout} currentUser={currentUser} />}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
        ) : (
          <>
            <Routes>
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={isAuthenticated ? <Home currentUser={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/home" element={isAuthenticated ? <Home currentUser={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/explore" element={isAuthenticated ? <TripExplore currentUser={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/map" element={isAuthenticated ? <TripExplore currentUser={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/search" element={isAuthenticated ? <TripExplore currentUser={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/profile" element={isAuthenticated ? <Profile currentUser={currentUser} onUpdateUser={handleUpdateUser} /> : <Navigate to="/login" />} />
              <Route path="/chat" element={isAuthenticated ? <Chat currentUser={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/destination-chat/:groupId" element={isAuthenticated ? <DestinationChat currentUser={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/trip-chat/:tripId" element={isAuthenticated ? <TripChat currentUser={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/trip-group-chat/:tripId" element={isAuthenticated ? <TripGroupChat tripId={new URLSearchParams(window.location.search).get('tripId')} currentUser={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/karma" element={isAuthenticated ? <Karma currentUser={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/feedback" element={isAuthenticated ? <Feedback currentUser={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/create-trip" element={isAuthenticated ? <CreateTrip currentUser={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/edit-trip/:id" element={isAuthenticated ? <EditTrip currentUser={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/trip-review/:tripId" element={isAuthenticated ? <TripReview currentUser={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/trip-location/:tripId" element={isAuthenticated ? <TripLocationMap currentUser={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/suggestions" element={isAuthenticated ? <TripSuggestions currentUser={currentUser} /> : <Navigate to="/login" />} />
              
              {/* Meetup Routes */}
              <Route path="/meetup" element={isAuthenticated ? <MeetupHome currentUser={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/meetup/home" element={isAuthenticated ? <MeetupHome currentUser={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/meetup/create" element={isAuthenticated ? <CreateEvent currentUser={currentUser} /> : <Navigate to="/login" />} />
              <Route path="/meetup/event/:eventId" element={isAuthenticated ? <EventDetails currentUser={currentUser} /> : <Navigate to="/login" />} />
            </Routes>
          </>
        )}
      </div>
    </Router>
  );
}

export default App;

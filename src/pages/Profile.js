import React, { useState, useEffect } from 'react';
import { subscribeToTrips } from '../firebaseUtils';
import './Profile.css';

// Utility function to compress image
const compressImage = (base64String, maxWidth = 300, maxHeight = 300, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64String;
    
    const timeout = setTimeout(() => {
      reject(new Error('Image compression timeout'));
    }, 5000);
    
    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const result = canvas.toDataURL('image/jpeg', quality);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      clearTimeout(timeout);
      reject(error || new Error('Image failed to load'));
    };
  });
};

function Profile({ currentUser, onUpdateUser }) {
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [contact, setContact] = useState(currentUser?.contact || '');
  const [gender, setGender] = useState(currentUser?.gender || '');
  const [profileImage, setProfileImage] = useState(currentUser?.profileImage || null);
  const [imagePreview, setImagePreview] = useState(currentUser?.profileImage || null);
  const [backgroundImage, setBackgroundImage] = useState(currentUser?.backgroundImage || null);
  const [backgroundPreview, setBackgroundPreview] = useState(currentUser?.backgroundImage || null);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hostedTrips, setHostedTrips] = useState([]);

  useEffect(() => {
    // Refresh user data from localStorage only when entering/exiting edit mode
    if (currentUser?.id) {
      const users = JSON.parse(localStorage.getItem('users')) || [];
      const updatedUser = users.find(u => u.id === currentUser.id);
      if (updatedUser) {
        setProfileImage(updatedUser.profileImage || null);
        setImagePreview(updatedUser.profileImage || null);
        setBackgroundImage(updatedUser.backgroundImage || null);
        setBackgroundPreview(updatedUser.backgroundImage || null);
        setBio(updatedUser.bio || '');
        setUsername(updatedUser.username || '');
        setContact(updatedUser.contact || '');
        setGender(updatedUser.gender || '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  useEffect(() => {
    // Load trips from Firebase
    const unsubscribe = subscribeToTrips((firebaseTrips) => {
      // Filter trips hosted by current user
      const userTrips = firebaseTrips.filter(trip => trip.hostId === currentUser?.id);
      setHostedTrips(userTrips);
    });
    
    return () => unsubscribe();
  }, [currentUser?.id]);

  useEffect(() => {
    // When exiting edit mode, refresh images from database to show saved state
    if (!isEditing && currentUser?.id) {
      const users = JSON.parse(localStorage.getItem('users')) || [];
      const updatedUser = users.find(u => u.id === currentUser.id);
      if (updatedUser) {
        setProfileImage(updatedUser.profileImage || null);
        setImagePreview(updatedUser.profileImage || null);
        setBackgroundImage(updatedUser.backgroundImage || null);
        setBackgroundPreview(updatedUser.backgroundImage || null);
      }
    }
  }, [isEditing, currentUser?.id]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image is too large. Please choose an image under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        // Compress the image
        const compressedImage = await compressImage(reader.result, 300, 300, 0.7);
        setProfileImage(compressedImage);
        setImagePreview(compressedImage);
      } catch (error) {
        console.error('Error compressing image:', error);
        alert('Error processing image. Please try another image.');
      }
    };
    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      alert('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleBackgroundUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 10MB for background)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image is too large. Please choose an image under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        // Compress the background image (wider dimensions)
        const compressedImage = await compressImage(reader.result, 800, 300, 0.65);
        setBackgroundImage(compressedImage);
        setBackgroundPreview(compressedImage);
      } catch (error) {
        console.error('Error compressing image:', error);
        alert('Error processing image. Please try another image.');
      }
    };
    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      alert('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      let profileImageURL = profileImage;
      let backgroundImageURL = backgroundImage;

      // Store images as base64 in localStorage (Firebase Storage disabled for local development)
      // Firebase uploads require proper domain authorization - using localStorage for now
      if (profileImage && profileImage.startsWith('data:')) {
        profileImageURL = profileImage;
      }

      // Store background image as base64 in localStorage
      if (backgroundImage && backgroundImage.startsWith('data:')) {
        backgroundImageURL = backgroundImage;
      }

      // Update profile in localStorage (primary storage)
      // Note: Firebase Firestore update is optional for development

      // Update local storage (primary storage)
      const updatedUser = { 
        ...currentUser, 
        bio,
        username,
        contact,
        gender,
        profileImage: profileImageURL || null,
        backgroundImage: backgroundImageURL || null
      };
      
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      // Update users list in localStorage
      const users = JSON.parse(localStorage.getItem('users')) || [];
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      if (userIndex !== -1) {
        users[userIndex] = updatedUser;
      } else {
        users.push(updatedUser);
      }
      localStorage.setItem('users', JSON.stringify(users));
      
      // Update parent component's currentUser state
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      
      setSaved(true);
      setTimeout(() => {
        setIsEditing(false);
        setSaved(false);
      }, 1500);
      
      alert('✅ Profile saved successfully!');
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        alert('Storage quota exceeded. Please use smaller images.');
      } else {
        console.error('Save error:', error);
        alert('Error saving profile. Please try again.');
      }
      setSaved(false);
    }
  };

  return (
    <div className="container">
      <div className="profile-card card">
        <h1>👤 My Profile</h1>
        {saved && <div className="alert alert-success">Profile saved!</div>}
        
        {/* Background Image Section */}
        <div 
          className="profile-image-section"
          style={backgroundPreview ? { backgroundImage: `url(${backgroundPreview})` } : {}}
        >
          {/* Profile Image */}
          <div className="profile-image-wrapper">
            {imagePreview && (
              <img src={imagePreview} alt="Profile" className="profile-image" />
            )}
          </div>
        </div>

        {/* View Mode - Display only */}
        {!isEditing ? (
          <div className="profile-view">
            <div className="profile-section">
              <h3>👤 User Information</h3>
              
              <div className="info-group">
                <label>Username</label>
                <p className="info-text">{username || 'Not set'}</p>
              </div>

              <div className="info-group">
                <label>🏆 Karma Points</label>
                <p className="info-text" style={{ fontSize: '18px', color: '#667eea', fontWeight: 'bold' }}>
                  {currentUser?.karma || 0}
                </p>
              </div>

              <div className="info-group">
                <label>📧 Email</label>
                <p className="info-text">{currentUser?.email}</p>
              </div>

              {contact && (
                <div className="info-group">
                  <label>📱 Contact</label>
                  <p className="info-text">{contact}</p>
                </div>
              )}

              {gender && (
                <div className="info-group">
                  <label>👫 Gender</label>
                  <p className="info-text">{gender}</p>
                </div>
              )}

              {bio && (
                <div className="info-group">
                  <label>📝 Bio</label>
                  <p className="info-text">{bio}</p>
                </div>
              )}
            </div>

            <button onClick={() => setIsEditing(true)} className="btn btn-primary" style={{ marginTop: '20px', width: '100%' }}>
              ✏️ Edit Profile
            </button>
          </div>
        ) : (
          /* Edit Mode - Form inputs */
          <div className="profile-edit">
            {/* Profile Image Upload Section */}
            <div className="profile-image-upload">
              <label>📸 Profile Photo</label>
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Profile preview" className="preview-img" />
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => {
                      setImagePreview(null);
                      setProfileImage(null);
                      document.getElementById('profile-image-upload').value = '';
                    }}
                  >
                    Remove Image
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="image-input"
                id="profile-image-upload"
              />
              <label htmlFor="profile-image-upload" className="image-upload-label">
                📸 Upload Profile Photo
              </label>
            </div>

            {/* Background Image Upload Section */}
            <div className="profile-image-upload">
              <label>🖼️ Background Photo</label>
              {backgroundPreview && (
                <div className="image-preview">
                  <img src={backgroundPreview} alt="Background preview" className="preview-img" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover' }} />
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => {
                      setBackgroundPreview(null);
                      setBackgroundImage(null);
                      document.getElementById('background-image-upload').value = '';
                    }}
                  >
                    Remove Image
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleBackgroundUpload}
                className="image-input"
                id="background-image-upload"
              />
              <label htmlFor="background-image-upload" className="image-upload-label">
                🖼️ Upload Background Photo
              </label>
            </div>

            {/* User Information Section */}
            <div className="profile-section">
              <h3>User Information</h3>
              
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <p className="display-text"><strong>{currentUser?.email}</strong></p>
              </div>

              <div className="form-group">
                <label>Contact Details</label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Phone number or contact info"
                />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others about yourself..."
                />
              </div>
            </div>

            <div className="button-group">
              <button onClick={handleSave} className="btn btn-primary">Save Profile</button>
              <button onClick={() => setIsEditing(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div className="profile-trips-section">
        <h2>🗺️ My Hosted Trips</h2>
        {hostedTrips.length === 0 ? (
          <p className="no-trips">You haven't hosted any trips yet. <a href="/create-trip">Create one!</a></p>
        ) : (
          <div className="trips-grid">
            {hostedTrips.map(trip => (
              <div key={trip.id} className="trip-card card">
                {trip.image && (
                  <div className="trip-image-container">
                    <img src={trip.image} alt={trip.title} className="trip-image" />
                  </div>
                )}
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3>{trip.title}</h3>
                  <p className="trip-location">📍 {trip.location}</p>
                  <p className="trip-desc">{trip.description}</p>
                  <p className="trip-date">📅 {new Date(trip.date).toLocaleDateString()}</p>
                  {trip.participants && trip.participants.length > 0 && (
                    <p className="trip-participants">👥 {trip.participants.length} joined</p>
                  )}
                  <div className="trip-actions" style={{ marginTop: 'auto' }}>
                    <a href={`/edit-trip/${trip.id}`} className="btn btn-primary">Edit</a>
                    <a href="/map" className="btn btn-secondary">🧭 Navigate</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;

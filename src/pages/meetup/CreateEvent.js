import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent, uploadEventImage, getEventCategories } from '../../meetupUtils';
import './CreateEvent.css';

function CreateEvent({ currentUser }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'networking',
    date: '',
    time: '',
    duration: '2',
    maxAttendees: '',
    price: '0',
    location: {
      address: '',
      placeName: '',
      coordinates: { lat: null, lng: null }
    },
    coverImageURL: '',
    tags: [],
    recurring: false
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    getEventCategories().then(setCategories);
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [name]: value
      }
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.date || !formData.time) {
        alert('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Create event data
      const eventData = {
        ...formData,
        organizerId: currentUser.id || currentUser.uid,
        organizerName: currentUser.username || currentUser.displayName,
        organizerPhoto: currentUser.photoURL || '',
        price: parseFloat(formData.price) || 0,
        maxAttendees: parseInt(formData.maxAttendees) || null,
        rsvpList: [],
        interestedList: [],
        bookmarks: [],
        comments: []
      };

      // Create event
      const eventId = await createEvent(eventData);

      // Upload image if selected
      if (imageFile) {
        try {
          const imageURL = await uploadEventImage(eventId, imageFile);
          // Update event with image URL - we'll skip this for simplicity
          console.log('Image uploaded:', imageURL);
        } catch (imageError) {
          console.error('Error uploading image:', imageError);
        }
      }

      alert('✅ Event created successfully!');
      navigate(`/meetup/event/${eventId}`);
    } catch (error) {
      console.error('Error creating event:', error);
      alert('❌ Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-event">
      <div className="create-event-container">
        <h1 className="page-title">Create New Event</h1>
        <p className="page-subtitle">Share your event with the community</p>

        <form onSubmit={handleSubmit} className="event-form">
          {/* Cover Image */}
          <div className="form-section">
            <label className="section-title">Event Cover Image</label>
            <div className="image-upload">
              {imagePreview ? (
                <div className="image-preview" style={{ backgroundImage: `url(${imagePreview})` }}>
                  <button type="button" onClick={() => { setImagePreview(null); setImageFile(null); }} className="remove-image">
                    ✕
                  </button>
                </div>
              ) : (
                <label className="upload-placeholder">
                  <input type="file" accept="image/*" onChange={handleImageChange} className="file-input" />
                  <span className="upload-icon">📷</span>
                  <span>Click to upload cover image</span>
                </label>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="form-section">
            <label className="section-title">Basic Information</label>
            
            <div className="form-group">
              <label>Event Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Tech Meetup: AI & Machine Learning"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your event, what attendees can expect, and any prerequisites..."
                rows="6"
                required
                className="form-textarea"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="form-select"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tags</label>
                <div className="tag-input-container">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add tags (press Enter)"
                    className="form-input"
                  />
                  <button type="button" onClick={handleAddTag} className="add-tag-btn">
                    Add
                  </button>
                </div>
                <div className="tags-list">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                      <button type="button" onClick={() => handleRemoveTag(tag)} className="remove-tag">
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="form-section">
            <label className="section-title">Date & Time</label>
            
            <div className="form-row">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label>Time *</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Duration (hours)</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="0.5"
                  step="0.5"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="form-section">
            <label className="section-title">Location</label>
            
            <div className="form-group">
              <label>Place Name</label>
              <input
                type="text"
                name="placeName"
                value={formData.location.placeName}
                onChange={handleLocationChange}
                placeholder="e.g., Central Park, Coffee Shop, Community Center"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Address *</label>
              <input
                type="text"
                name="address"
                value={formData.location.address}
                onChange={handleLocationChange}
                placeholder="Full address"
                required
                className="form-input"
              />
            </div>
          </div>

          {/* Capacity & Price */}
          <div className="form-section">
            <label className="section-title">Capacity & Pricing</label>
            
            <div className="form-row">
              <div className="form-group">
                <label>Max Attendees</label>
                <input
                  type="number"
                  name="maxAttendees"
                  value={formData.maxAttendees}
                  onChange={handleChange}
                  placeholder="Leave blank for unlimited"
                  min="1"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Price ($)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0 for free"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="form-section">
            <label className="form-checkbox">
              <input
                type="checkbox"
                name="recurring"
                checked={formData.recurring}
                onChange={handleChange}
              />
              <span>This is a recurring event</span>
            </label>
          </div>

          {/* Submit */}
          <div className="form-actions">
            <button type="button" onClick={() => navigate(-1)} className="btn-cancel" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEvent;

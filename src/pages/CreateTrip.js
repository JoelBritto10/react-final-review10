import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateTrip.css';
import { extractCoordinatesFromUrl, isValidGoogleMapsUrl } from '../utils/mapsUrlParser';
import { createTrip, uploadTripImage } from '../firebaseUtils';

// Utility function to compress image
const compressImage = (base64String, maxWidth = 400, maxHeight = 400, quality = 0.65) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64String;
    img.onload = () => {
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
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64String);
  });
};

function CreateTrip({ currentUser }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    time: '',
    mapsUrl: '',
    image: null,
    category: 'all',
    maxCount: '',
    tripType: 'group',
    documents: [] // New: documents array
  });

  // const categories = ['all', 'beach', 'mountain', 'city', 'adventure', 'culture', 'sports'];

  // const [userLocation] = useState({ lat: 37.7749, lng: -122.4194 }); // Not used
  const [urlInput, setUrlInput] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState([]); // New: track uploaded documents

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    // Get user's current location (removed unused setUserLocation)
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image is too large. Please choose an image under 10MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          // Compress the image
          const compressedImage = await compressImage(reader.result, 400, 400, 0.65);
          setFormData(prev => ({
            ...prev,
            image: compressedImage
          }));
          setImagePreview(compressedImage);
        } catch (error) {
          console.error('Error compressing image:', error);
          alert('Error processing image. Please try another image.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle document upload (up to 20MB)
  const handleDocumentUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        alert('Document is too large. Please choose a file under 20MB.');
        return;
      }

      // Check file type (allow common document formats)
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif'
      ];

      if (!allowedTypes.includes(file.type)) {
        alert('❌ Invalid file type. Please upload:\n• PDF\n• Word (DOC/DOCX)\n• Excel (XLS/XLSX)\n• Text files\n• Images (JPG/PNG/GIF)');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const documentData = {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            data: reader.result
          };

          setUploadedDocuments(prev => [...prev, documentData]);
          
          // Reset file input
          document.getElementById('document-upload').value = '';
          alert(`✅ Document "${file.name}" added successfully!`);
        } catch (error) {
          console.error('Error processing document:', error);
          alert('Error processing document. Please try again.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove document
  const handleRemoveDocument = (index) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
  };
  const handleUrlInput = async (e) => {
    e?.preventDefault?.();
    if (!urlInput.trim()) {
      alert('Please enter a Google Maps shortened link');
      return;
    }

    const url = urlInput.trim();

    // Validate URL format
    if (!isValidGoogleMapsUrl(url)) {
      alert('❌ Invalid link format.\n\n📌 Only shortened Google Maps links are accepted:\n• https://maps.app.goo.gl/...\n\n💡 How to get a shortened link:\n1. Open Google Maps\n2. Find your location\n3. Click "Share" button\n4. Copy the shortened link\n5. Paste it here');
      return;
    }

    // Extract/validate shortened URL
    const result = await extractCoordinatesFromUrl(url);

    if (result.success) {
      // For shortened URLs, store the URL itself
      setFormData(prev => ({
        ...prev,
        mapsUrl: url // Store the shortened URL directly
      }));
      setUrlInput('');
      alert('✅ Location link added successfully!');
    } else {
      alert('❌ ' + (result.error || 'Invalid link.'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim()) {
      alert('Please enter a trip title');
      return;
    }

    if (!formData.description.trim()) {
      alert('Please enter a trip description');
      return;
    }

    if (!formData.location.trim()) {
      alert('Please enter a location');
      return;
    }

    if (!formData.date) {
      alert('Please select a date');
      return;
    }

    if (!formData.time) {
      alert('Please select a time');
      return;
    }

    if (!formData.mapsUrl) {
      alert('Please add a location using the Google Maps URL');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare trip data
      const tripData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        date: formData.date,
        time: formData.time,
        mapsUrl: formData.mapsUrl,
        hostId: currentUser?.id || currentUser?.uid,
        hostName: currentUser?.username || currentUser?.displayName || 'User',
        hostAvatar: currentUser?.avatar || null,
        participants: [currentUser?.id || currentUser?.uid],
        participantCount: 1,
        image: formData.image || null,
        category: formData.category,
        maxCount: formData.maxCount ? parseInt(formData.maxCount) : null,
        tripType: formData.tripType,
        documents: uploadedDocuments.length > 0 ? uploadedDocuments : [], // Add documents
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Upload image to Firebase Storage if exists
      if (formData.image && currentUser?.id) {
        try {
          const imageUrl = await uploadTripImage(currentUser.id, formData.image, tripData.title);
          if (imageUrl) {
            tripData.image = imageUrl;
          } else {
            console.warn('Image upload returned null, continuing without image');
            tripData.image = null;
          }
        } catch (imageError) {
          console.warn('Image upload failed, continuing without image:', imageError);
          tripData.image = null;
        }
      }

      // Create trip in Firebase
      await createTrip(tripData);
      
      alert('✅ Trip created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        location: '',
        date: '',
        time: '',
        mapsUrl: '',
        image: null,
        category: 'all',
        maxCount: '',
        tripType: 'group',
        documents: []
      });
      setImagePreview(null);
      setUrlInput('');
      setUploadedDocuments([]);
      
      navigate('/home');
    } catch (error) {
      console.error('Error creating trip:', error);
      alert('❌ Error creating trip: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="form-card card">
        <h1>➕ Create New Trip</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Trip Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Mountain Adventure"
              required
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your trip..."
              required
            />
          </div>

          <div className="form-group">
            <label>Location (Plain Text) *</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., San Francisco, CA or Times Square, New York"
              required
            />
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
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
              />
            </div>
          </div>

          <div className="form-group">
            <label>Trip Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="category-select"
            >
              <option value="all">🌍 All</option>
              <option value="beach">🏖️ Beach</option>
              <option value="mountain">⛰️ Mountain</option>
              <option value="city">🏙️ City</option>
              <option value="adventure">🎯 Adventure</option>
              <option value="culture">🎭 Culture</option>
              <option value="sports">⚽ Sports</option>
            </select>
          </div>

          <div className="form-group">
            <label>👥 Max Participants (Optional)</label>
            <input
              type="number"
              name="maxCount"
              value={formData.maxCount}
              onChange={handleChange}
              placeholder="Maximum number of members allowed (leave blank for unlimited)"
              min="1"
              max="999"
            />
            <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
              Leave blank for unlimited participants
            </p>
          </div>

          <div className="form-group">
            <label>👫 Trip Type</label>
            <select
              name="tripType"
              value={formData.tripType}
              onChange={handleChange}
              className="category-select"
            >
              <option value="group">👥 Group Trip (Friends & Singles)</option>
              <option value="couples">👫 Couples Only</option>
            </select>
            <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
              Choose who can join this trip
            </p>
          </div>

          {/* Image Upload Section */}
          <div className="form-group">
            <label>Trip Image</label>
            <div className="image-upload-container">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="image-input"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="image-upload-label">
                📸 Choose Image
              </label>
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Trip preview" className="preview-img" />
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData(prev => ({ ...prev, image: null }));
                      document.getElementById('image-upload').value = '';
                    }}
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="form-group">
            <label>📄 Trip Documents (Optional - up to 20MB each)</label>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
              Upload verification documents, itineraries, permits, or other trip details (PDF, Word, Excel, Images, Text)
            </p>
            <div className="document-upload-container">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
                onChange={handleDocumentUpload}
                className="document-input"
                id="document-upload"
              />
              <label htmlFor="document-upload" className="document-upload-label">
                📎 Upload Document (Max 20MB)
              </label>
            </div>

            {/* Display uploaded documents */}
            {uploadedDocuments.length > 0 && (
              <div className="uploaded-documents">
                <h4>Uploaded Documents ({uploadedDocuments.length}):</h4>
                <ul className="documents-list">
                  {uploadedDocuments.map((doc, index) => (
                    <li key={index} className="document-item">
                      <span className="doc-icon">📄</span>
                      <div className="doc-info">
                        <span className="doc-name">{doc.fileName}</span>
                        <span className="doc-size">
                          {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-small btn-remove"
                        onClick={() => handleRemoveDocument(index)}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
                <p style={{ fontSize: '12px', color: '#667eea', marginTop: '10px' }}>
                  ✅ Documents will be stored in Firebase and visible only to trip details (not on homepage)
                </p>
              </div>
            )}
          </div>

          <div className="location-picker-section">
            <h3>📍 Trip Location</h3>
            <p className="helper-text">Paste a shortened Google Maps link to set your trip location:</p>

            {/* URL Input - Simple */}
            <div className="picker-method">
              <div className="url-input-form">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Paste shortened Google Maps link here"
                  className="url-input"
                />
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleUrlInput}
                >
                  Add Location
                </button>
              </div>
              <p className="helper-text" style={{ marginTop: '8px', fontSize: '12px' }}>
                📌 Only shortened links accepted:<br/>
                • <code style={{background: '#f0f0f0', padding: '2px 6px'}}>https://maps.app.goo.gl/...</code><br/>
                <br/>
                💡 Quick steps:<br/>
                1. Open Google Maps<br/>
                2. Find your location<br/>
                3. Click "Share" button<br/>
                4. Copy the shortened link<br/>
                5. Paste it here
              </p>
            </div>
          </div>

          {/* Display Selected Location */}
          {formData.mapsUrl && (
            <div className="coordinates-display card">
              <h4>✅ Location Set</h4>
              <p><strong>Location Name:</strong> {formData.location || 'Trip location'}</p>
              <p className="url-display">
                <strong>Google Maps:</strong>
                <br />
                <a href={formData.mapsUrl} target="_blank" rel="noopener noreferrer" className="maps-url">
                  View on Maps →
                </a>
              </p>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '20px' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? '⏳ Creating Trip...' : '✅ Create Trip'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateTrip;

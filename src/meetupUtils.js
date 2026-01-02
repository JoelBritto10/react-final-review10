import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

// ============= EVENT MANAGEMENT =============

/**
 * Create a new meetup event
 */
export const createEvent = async (eventData) => {
  try {
    const eventsRef = collection(db, 'events');
    const newEvent = {
      ...eventData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      rsvpList: eventData.rsvpList || [],
      interestedList: eventData.interestedList || [],
      bookmarks: eventData.bookmarks || [],
      comments: eventData.comments || [],
      attendeeCount: 0
    };
    
    const docRef = await addDoc(eventsRef, newEvent);
    return docRef.id;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

/**
 * Get a single event by ID
 */
export const getEvent = async (eventId) => {
  try {
    const eventDoc = await getDoc(doc(db, 'events', eventId));
    if (eventDoc.exists()) {
      return { id: eventDoc.id, ...eventDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting event:', error);
    throw error;
  }
};

/**
 * Update an event
 */
export const updateEvent = async (eventId, updates) => {
  try {
    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

/**
 * Delete an event
 */
export const deleteEvent = async (eventId) => {
  try {
    await deleteDoc(doc(db, 'events', eventId));
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time event updates
 */
export const subscribeToEvents = (callback) => {
  const eventsRef = collection(db, 'events');
  return onSnapshot(eventsRef, (snapshot) => {
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(events);
  });
};

/**
 * Get events by category
 */
export const getEventsByCategory = async (category) => {
  try {
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('category', '==', category));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting events by category:', error);
    throw error;
  }
};

/**
 * Get events by organizer
 */
export const getEventsByOrganizer = async (organizerId) => {
  try {
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('organizerId', '==', organizerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting events by organizer:', error);
    throw error;
  }
};

// ============= RSVP MANAGEMENT =============

/**
 * RSVP to an event
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {string} status - 'going', 'interested', 'declined'
 */
export const rsvpToEvent = async (eventId, userId, status) => {
  try {
    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await getDoc(eventRef);
    
    if (!eventSnap.exists()) {
      throw new Error('Event not found');
    }
    
    const eventData = eventSnap.data();
    
    // Remove user from all RSVP lists first
    const updates = {
      rsvpList: arrayRemove(userId),
      interestedList: arrayRemove(userId)
    };
    
    // Add to appropriate list based on status
    if (status === 'going') {
      // Check if event is full
      if (eventData.maxAttendees && eventData.rsvpList?.length >= eventData.maxAttendees) {
        throw new Error('Event is full');
      }
      updates.rsvpList = arrayUnion(userId);
    } else if (status === 'interested') {
      updates.interestedList = arrayUnion(userId);
    }
    
    await updateDoc(eventRef, updates);
    
    // Create RSVP record
    const rsvpRef = collection(db, 'rsvps');
    await addDoc(rsvpRef, {
      eventId,
      userId,
      status,
      timestamp: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error RSVPing to event:', error);
    throw error;
  }
};

/**
 * Get user's RSVP status for an event
 */
export const getUserRSVPStatus = async (eventId, userId) => {
  try {
    const rsvpRef = collection(db, 'rsvps');
    const q = query(
      rsvpRef,
      where('eventId', '==', eventId),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    return snapshot.docs[0].data().status;
  } catch (error) {
    console.error('Error getting RSVP status:', error);
    throw error;
  }
};

// ============= BOOKMARK MANAGEMENT =============

/**
 * Bookmark/save an event
 */
export const bookmarkEvent = async (eventId, userId) => {
  try {
    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, {
      bookmarks: arrayUnion(userId)
    });
  } catch (error) {
    console.error('Error bookmarking event:', error);
    throw error;
  }
};

/**
 * Remove bookmark from an event
 */
export const unbookmarkEvent = async (eventId, userId) => {
  try {
    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, {
      bookmarks: arrayRemove(userId)
    });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    throw error;
  }
};

/**
 * Get user's bookmarked events
 */
export const getUserBookmarkedEvents = async (userId) => {
  try {
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('bookmarks', 'array-contains', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting bookmarked events:', error);
    throw error;
  }
};

// ============= COMMENT MANAGEMENT =============

/**
 * Add a comment to an event
 */
export const addEventComment = async (eventId, userId, userName, userPhoto, text) => {
  try {
    const commentRef = collection(db, 'comments');
    const newComment = {
      eventId,
      userId,
      userName,
      userPhoto,
      text,
      likes: [],
      replies: [],
      timestamp: serverTimestamp()
    };
    
    const docRef = await addDoc(commentRef, newComment);
    return docRef.id;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

/**
 * Get comments for an event
 */
export const getEventComments = async (eventId) => {
  try {
    const commentsRef = collection(db, 'comments');
    const q = query(commentsRef, where('eventId', '==', eventId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting comments:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time comments for an event
 */
export const subscribeToEventComments = (eventId, callback) => {
  const commentsRef = collection(db, 'comments');
  const q = query(commentsRef, where('eventId', '==', eventId));
  
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(comments);
  });
};

/**
 * Like a comment
 */
export const likeComment = async (commentId, userId) => {
  try {
    const commentRef = doc(db, 'comments', commentId);
    await updateDoc(commentRef, {
      likes: arrayUnion(userId)
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    throw error;
  }
};

/**
 * Reply to a comment
 */
export const replyToComment = async (commentId, userId, userName, userPhoto, text) => {
  try {
    const commentRef = doc(db, 'comments', commentId);
    const reply = {
      userId,
      userName,
      userPhoto,
      text,
      timestamp: new Date().toISOString()
    };
    
    await updateDoc(commentRef, {
      replies: arrayUnion(reply)
    });
  } catch (error) {
    console.error('Error replying to comment:', error);
    throw error;
  }
};

// ============= IMAGE UPLOAD =============

/**
 * Upload event cover image
 */
export const uploadEventImage = async (eventId, file) => {
  try {
    const storageRef = ref(storage, `events/${eventId}/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading event image:', error);
    throw error;
  }
};

// ============= CATEGORIES =============

/**
 * Get all event categories
 */
export const getEventCategories = async () => {
  try {
    const categoriesRef = collection(db, 'categories');
    const snapshot = await getDocs(categoriesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting categories:', error);
    // Return default categories if fetch fails
    return [
      { id: 'networking', name: 'Networking', icon: '🤝', color: '#3B82F6' },
      { id: 'sports', name: 'Sports & Fitness', icon: '⚽', color: '#10B981' },
      { id: 'tech', name: 'Technology', icon: '💻', color: '#8B5CF6' },
      { id: 'arts', name: 'Arts & Culture', icon: '🎨', color: '#EC4899' },
      { id: 'music', name: 'Music', icon: '🎵', color: '#F59E0B' },
      { id: 'food', name: 'Food & Drink', icon: '🍕', color: '#EF4444' },
      { id: 'outdoor', name: 'Outdoor & Adventure', icon: '🏔️', color: '#14B8A6' },
      { id: 'education', name: 'Education & Learning', icon: '📚', color: '#6366F1' }
    ];
  }
};

/**
 * Initialize default categories
 */
export const initializeCategories = async () => {
  try {
    const categories = [
      { id: 'networking', name: 'Networking', icon: '🤝', color: '#3B82F6', description: 'Professional networking events' },
      { id: 'sports', name: 'Sports & Fitness', icon: '⚽', color: '#10B981', description: 'Sports and fitness activities' },
      { id: 'tech', name: 'Technology', icon: '💻', color: '#8B5CF6', description: 'Tech meetups and workshops' },
      { id: 'arts', name: 'Arts & Culture', icon: '🎨', color: '#EC4899', description: 'Art exhibitions and cultural events' },
      { id: 'music', name: 'Music', icon: '🎵', color: '#F59E0B', description: 'Music concerts and jam sessions' },
      { id: 'food', name: 'Food & Drink', icon: '🍕', color: '#EF4444', description: 'Food tastings and culinary events' },
      { id: 'outdoor', name: 'Outdoor & Adventure', icon: '🏔️', color: '#14B8A6', description: 'Outdoor activities and adventures' },
      { id: 'education', name: 'Education & Learning', icon: '📚', color: '#6366F1', description: 'Workshops and learning sessions' }
    ];
    
    for (const category of categories) {
      await setDoc(doc(db, 'categories', category.id), category);
    }
    
    console.log('Categories initialized successfully');
  } catch (error) {
    console.error('Error initializing categories:', error);
    throw error;
  }
};

// ============= NOTIFICATIONS =============

/**
 * Create a notification for a user
 */
export const createNotification = async (userId, type, title, message, eventId, actionUrl) => {
  try {
    const notifRef = collection(db, 'notifications');
    await addDoc(notifRef, {
      userId,
      type,
      title,
      message,
      eventId,
      actionUrl,
      read: false,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Get user notifications
 */
export const getUserNotifications = async (userId) => {
  try {
    const notifsRef = collection(db, 'notifications');
    const q = query(notifsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

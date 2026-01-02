import { initializeCategories, createEvent } from './meetupUtils';

/**
 * Initialize sample event data for the meetup platform
 */
export const initializeSampleEventData = async (currentUser) => {
  try {
    console.log('🌱 Initializing sample event data...');
    
    // Initialize categories first
    await initializeCategories();
    console.log('✅ Categories initialized');
    
    // Sample events data
    const sampleEvents = [
      {
        title: 'Tech Meetup: AI & Machine Learning Workshop',
        description: 'Join us for an interactive workshop on AI and ML basics. Learn about neural networks, deep learning, and practical applications. Perfect for beginners and enthusiasts!',
        category: 'tech',
        date: getDateString(7),
        time: '18:00',
        duration: '3',
        maxAttendees: 50,
        price: 0,
        location: {
          address: '123 Tech St, San Francisco, CA 94102',
          placeName: 'TechHub SF',
          coordinates: { lat: 37.7749, lng: -122.4194 }
        },
        tags: ['AI', 'Machine Learning', 'Workshop', 'Tech'],
        organizerId: currentUser?.id || 'sample-user',
        organizerName: currentUser?.username || 'Tech Organizer',
        organizerPhoto: currentUser?.photoURL || ''
      },
      {
        title: 'Sunday Morning Yoga in the Park',
        description: 'Start your Sunday with relaxing yoga session in Golden Gate Park. All levels welcome! Bring your own mat.',
        category: 'sports',
        date: getDateString(3),
        time: '08:00',
        duration: '2',
        maxAttendees: 30,
        price: 0,
        location: {
          address: 'Golden Gate Park, San Francisco, CA',
          placeName: 'Golden Gate Park',
          coordinates: { lat: 37.7694, lng: -122.4862 }
        },
        tags: ['Yoga', 'Fitness', 'Wellness', 'Outdoor'],
        organizerId: currentUser?.id || 'sample-user',
        organizerName: currentUser?.username || 'Wellness Guru',
        organizerPhoto: currentUser?.photoURL || ''
      },
      {
        title: 'Networking Night: Entrepreneurs & Startups',
        description: 'Meet fellow entrepreneurs, share ideas, and build connections. Great opportunity to find co-founders, mentors, or investors!',
        category: 'networking',
        date: getDateString(5),
        time: '19:00',
        duration: '2.5',
        maxAttendees: 100,
        price: 15,
        location: {
          address: '456 Startup Ave, San Francisco, CA 94103',
          placeName: 'Innovation Hub',
          coordinates: { lat: 37.7849, lng: -122.4094 }
        },
        tags: ['Networking', 'Startups', 'Business', 'Entrepreneurship'],
        organizerId: currentUser?.id || 'sample-user',
        organizerName: currentUser?.username || 'Startup Founder',
        organizerPhoto: currentUser?.photoURL || ''
      },
      {
        title: 'Live Jazz Night at Blue Note',
        description: 'Experience an evening of smooth jazz with talented local musicians. Enjoy drinks and great atmosphere!',
        category: 'music',
        date: getDateString(2),
        time: '20:00',
        duration: '3',
        maxAttendees: 80,
        price: 25,
        location: {
          address: '789 Music Ln, San Francisco, CA 94104',
          placeName: 'Blue Note Jazz Club',
          coordinates: { lat: 37.7899, lng: -122.4094 }
        },
        tags: ['Music', 'Jazz', 'Live Performance', 'Entertainment'],
        organizerId: currentUser?.id || 'sample-user',
        organizerName: currentUser?.username || 'Music Lover',
        organizerPhoto: currentUser?.photoURL || ''
      },
      {
        title: 'Street Photography Walk',
        description: 'Explore the city through your lens! Join us for a guided street photography walk through vibrant neighborhoods.',
        category: 'arts',
        date: getDateString(4),
        time: '14:00',
        duration: '3',
        maxAttendees: 20,
        price: 0,
        location: {
          address: 'Mission District, San Francisco, CA',
          placeName: 'Mission District',
          coordinates: { lat: 37.7599, lng: -122.4148 }
        },
        tags: ['Photography', 'Art', 'Walking', 'Creative'],
        organizerId: currentUser?.id || 'sample-user',
        organizerName: currentUser?.username || 'Photo Artist',
        organizerPhoto: currentUser?.photoURL || ''
      },
      {
        title: 'Wine Tasting: Napa Valley Wines',
        description: 'Sample exquisite wines from Napa Valley vineyards. Learn about wine pairing and tasting techniques from a sommelier.',
        category: 'food',
        date: getDateString(6),
        time: '18:30',
        duration: '2.5',
        maxAttendees: 40,
        price: 35,
        location: {
          address: '321 Wine St, San Francisco, CA 94105',
          placeName: 'Wine Bar SF',
          coordinates: { lat: 37.7849, lng: -122.3974 }
        },
        tags: ['Wine', 'Food', 'Tasting', 'Social'],
        organizerId: currentUser?.id || 'sample-user',
        organizerName: currentUser?.username || 'Wine Enthusiast',
        organizerPhoto: currentUser?.photoURL || ''
      },
      {
        title: 'Hiking Adventure: Mount Tamalpais',
        description: 'Join us for a challenging hike up Mount Tamalpais with breathtaking views of the Bay Area. Moderate fitness level required.',
        category: 'outdoor',
        date: getDateString(8),
        time: '07:00',
        duration: '6',
        maxAttendees: 25,
        price: 0,
        location: {
          address: 'Mount Tamalpais State Park, Mill Valley, CA',
          placeName: 'Mount Tamalpais',
          coordinates: { lat: 37.9235, lng: -122.5965 }
        },
        tags: ['Hiking', 'Outdoor', 'Adventure', 'Nature'],
        organizerId: currentUser?.id || 'sample-user',
        organizerName: currentUser?.username || 'Adventure Seeker',
        organizerPhoto: currentUser?.photoURL || ''
      },
      {
        title: 'Python Programming Workshop for Beginners',
        description: 'Learn Python from scratch! Hands-on workshop covering basics, data structures, and simple projects.',
        category: 'education',
        date: getDateString(10),
        time: '10:00',
        duration: '4',
        maxAttendees: 30,
        price: 20,
        location: {
          address: '555 Learning Blvd, San Francisco, CA 94106',
          placeName: 'Code Academy',
          coordinates: { lat: 37.7749, lng: -122.4294 }
        },
        tags: ['Programming', 'Python', 'Workshop', 'Beginner'],
        organizerId: currentUser?.id || 'sample-user',
        organizerName: currentUser?.username || 'Code Teacher',
        organizerPhoto: currentUser?.photoURL || ''
      },
      {
        title: 'Book Club: Science Fiction Classics',
        description: 'Monthly book club discussing classic sci-fi novels. This month: "Dune" by Frank Herbert. Coffee and snacks provided!',
        category: 'education',
        date: getDateString(12),
        time: '19:00',
        duration: '2',
        maxAttendees: 15,
        price: 0,
        location: {
          address: '777 Book St, San Francisco, CA 94107',
          placeName: 'Cozy Bookshop Cafe',
          coordinates: { lat: 37.7649, lng: -122.4194 }
        },
        tags: ['Books', 'Reading', 'Discussion', 'Community'],
        organizerId: currentUser?.id || 'sample-user',
        organizerName: currentUser?.username || 'Bookworm',
        organizerPhoto: currentUser?.photoURL || ''
      },
      {
        title: 'Salsa Dancing Night - Beginner Friendly',
        description: 'Learn salsa basics and dance the night away! No partner needed. First lesson included for beginners.',
        category: 'music',
        date: getDateString(1),
        time: '20:00',
        duration: '3',
        maxAttendees: 60,
        price: 10,
        location: {
          address: '888 Dance Ave, San Francisco, CA 94108',
          placeName: 'Salsa Dance Studio',
          coordinates: { lat: 37.7949, lng: -122.4094 }
        },
        tags: ['Dance', 'Salsa', 'Social', 'Music'],
        organizerId: currentUser?.id || 'sample-user',
        organizerName: currentUser?.username || 'Dance Instructor',
        organizerPhoto: currentUser?.photoURL || ''
      }
    ];

    // Create events
    let createdCount = 0;
    for (const eventData of sampleEvents) {
      try {
        await createEvent(eventData);
        createdCount++;
      } catch (error) {
        console.error('Error creating event:', error);
      }
    }

    console.log(`✅ Successfully created ${createdCount} sample events`);
    return { success: true, count: createdCount };
  } catch (error) {
    console.error('❌ Error initializing sample data:', error);
    return { success: false, error };
  }
};

/**
 * Get date string for N days from now
 */
function getDateString(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

export default { initializeSampleEventData };

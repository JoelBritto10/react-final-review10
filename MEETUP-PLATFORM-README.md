# Minimalist Meetup Platform

A modern, clean meetup platform built with React 19 and Firebase, featuring event discovery, interactive features, and AI chatbot assistance.

## 🚀 Features Implemented

### Core Features

#### 1. **Event Management** ✅
- **Create Events**: Full-featured event creation with:
  - Title, description (with markdown support potential)
  - Category selection (8 categories)
  - Date & time picker
  - Duration
  - Max attendees limit
  - Price (free/paid)
  - Location (address and place name)
  - Event cover image upload
  - Tags/keywords
  - Recurring event option
- **Event Details Page**: Comprehensive event view with:
  - Cover image with gradient overlay
  - Full event information
  - Organizer profile card
  - Attendee list and counts
  - Location information
  - Tags display

#### 2. **RSVP System** ✅
- One-click RSVP (Going, Interested)
- Real-time attendee count updates
- Attendee limit validation
- Visual RSVP status indicators

#### 3. **Bookmark/Save Events** ✅
- Save events for later
- Quick bookmark toggle
- Persistent bookmark status

#### 4. **Comments & Discussions** ✅
- Real-time comment system
- Like comments (👍 reactions)
- Nested replies (1 level)
- User avatars and timestamps
- Edit capabilities for own comments

#### 5. **AI Chatbot** ✅
- Dedicated chatbot interface at `/chatbot`
- Pattern-based event discovery
- Natural language understanding (basic)
- Quick action buttons
- Real-time chat interface with typing indicators
- Event recommendations
- Help system

#### 6. **Home/Discover Page** ✅
- Hero section with search
- "Trending Events" carousel (sorted by RSVPs)
- "Recommended For You" (based on user interests)
- "Your Upcoming Events" section
- "Popular Categories" grid
- Quick search and location input

#### 7. **Category System** ✅
- 8 Event categories:
  - 🤝 Networking
  - ⚽ Sports & Fitness
  - 💻 Technology
  - 🎨 Arts & Culture
  - 🎵 Music
  - 🍕 Food & Drink
  - 🏔️ Outdoor & Adventure
  - 📚 Education & Learning

## 🛠️ Tech Stack

- **Frontend**: React 19, React Router v7
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Maps**: Google Maps API integration ready
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Styling**: CSS Modules with responsive design
- **Real-time**: Firestore real-time listeners

## 📂 Project Structure

```
src/
├── App.js                          # Main app with routing
├── firebase.js                     # Firebase configuration
├── firebaseUtils.js                # Trip-related Firebase utilities
├── meetupUtils.js                  # Meetup-specific Firebase utilities
├── sampleEventData.js              # Sample event data generator
├── pages/
│   ├── meetup/
│   │   ├── MeetupHome.js/css       # Home/Discover page
│   │   ├── CreateEvent.js/css      # Event creation form
│   │   ├── EventDetails.js/css     # Event details & RSVP
│   │   └── Chatbot.js/css          # AI chatbot interface
│   └── [original trip pages]       # Existing trip platform pages
└── components/
    └── [shared components]
```

## 🔧 Firebase Data Schema

### Collections

#### `/events/{eventId}`
```javascript
{
  title: string,
  description: string,
  category: string,
  date: string (YYYY-MM-DD),
  time: string (HH:MM),
  duration: string (hours),
  maxAttendees: number | null,
  price: number,
  location: {
    address: string,
    placeName: string,
    coordinates: { lat: number, lng: number }
  },
  coverImageURL: string,
  tags: string[],
  organizerId: string,
  organizerName: string,
  organizerPhoto: string,
  rsvpList: string[],          // User IDs
  interestedList: string[],    // User IDs
  bookmarks: string[],          // User IDs
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `/rsvps/{rsvpId}`
```javascript
{
  eventId: string,
  userId: string,
  status: 'going' | 'interested' | 'declined',
  timestamp: timestamp
}
```

#### `/comments/{commentId}`
```javascript
{
  eventId: string,
  userId: string,
  userName: string,
  userPhoto: string,
  text: string,
  likes: string[],              // User IDs who liked
  replies: [{
    userId: string,
    userName: string,
    userPhoto: string,
    text: string,
    timestamp: string
  }],
  timestamp: timestamp
}
```

#### `/categories/{categoryId}`
```javascript
{
  id: string,
  name: string,
  icon: string (emoji),
  color: string (hex),
  description: string
}
```

#### `/notifications/{notificationId}`
```javascript
{
  userId: string,
  type: string,
  title: string,
  message: string,
  eventId: string,
  actionUrl: string,
  read: boolean,
  timestamp: timestamp
}
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd react-final-review10
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Update `src/firebase.js` with your Firebase credentials
   - Ensure Firestore, Storage, and Authentication are enabled

4. **Run development server**
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000)

5. **Build for production**
   ```bash
   npm run build
   ```

## 📱 Key Routes

- `/meetup` or `/meetup/home` - Home/Discover page
- `/meetup/create` - Create new event
- `/meetup/event/:eventId` - Event details
- `/meetup/chatbot` or `/chatbot` - AI chatbot

## 🎨 Design Philosophy

- **Minimalist**: Clean, uncluttered interfaces
- **Professional**: Neutral color palette (white, gray, blue accents)
- **Responsive**: Mobile-first design
- **Accessible**: Clear hierarchy and readable typography
- **Smooth**: Transitions and micro-interactions

## 🔐 Authentication

The platform uses Firebase Authentication with:
- Email/password authentication
- Google Sign-In (existing implementation)
- Profile management

## 📊 Sample Data

Sample events can be initialized using:
```javascript
import { initializeSampleEventData } from './sampleEventData';
await initializeSampleEventData(currentUser);
```

This creates 10 diverse sample events across all categories.

## 🚧 Future Enhancements

### Phase 3: Interactive Map (Planned)
- Google Maps integration with event markers
- Map filters (distance, date, category, price)
- Location auto-complete
- List/Map toggle view

### Phase 4: Enhanced User Profiles (Planned)
- Profile photo crop functionality
- Interests multi-select
- Hosted/attended events display
- Profile settings page

### Phase 6: AI Integration (Enhancement)
- Gemini AI API integration
- Advanced NLP for queries
- Personalized recommendations
- Chat history persistence

### Phase 8: Notifications (Planned)
- Real-time push notifications
- Event reminders (1 day, 1 hour before)
- Notification center
- Web Push API integration

### Phase 9: Additional Pages (Planned)
- Search Results with advanced filters
- Saved Events page
- My Events (Hosted & Attending)
- Event edit functionality

## 🐛 Known Issues

- Map view not yet implemented (placeholder in EventDetails)
- AI chatbot uses pattern matching (Gemini API integration pending)
- Image upload doesn't update event after creation
- @mention functionality not implemented in comments

## 📝 Notes

- The platform coexists with the existing trip platform
- All meetup-related code is in `/pages/meetup/` and `meetupUtils.js`
- Sample data generator available for testing
- Build passes all ESLint checks

## 🤝 Contributing

The platform follows React best practices:
- Functional components with hooks
- Minimal state management
- Real-time Firestore integration
- Responsive CSS with mobile-first approach

## 📄 License

This project is part of a portfolio/review application.

---

**Status**: Core meetup features implemented ✅  
**Build Status**: Passing ✅  
**ESLint**: No errors ✅

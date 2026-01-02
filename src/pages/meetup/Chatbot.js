import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeToEvents } from '../../meetupUtils';
import './Chatbot.css';

function Chatbot({ currentUser }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [events, setEvents] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Load events for recommendations
    const unsubscribe = subscribeToEvents((fetchedEvents) => {
      setEvents(fetchedEvents);
    });

    // Initial welcome message
    setMessages([
      {
        id: 1,
        role: 'assistant',
        content: `Hello ${currentUser.username || 'there'}! 👋 I'm your event discovery assistant. I can help you:

• Find events near you
• Get personalized recommendations
• Search for specific activities
• Learn about upcoming events

What would you like to know about?`,
        timestamp: new Date()
      }
    ]);

    return () => unsubscribe();
  }, [currentUser, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateBotResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();

    // Simple pattern matching for demo purposes
    // In production, this would call Gemini AI API

    if (lowerMessage.includes('help')) {
      return `I can assist you with:

🔍 **Event Discovery**: "Find tech meetups" or "Show me sports events"
📍 **Location-based**: "What's happening near me?"
🎯 **Interests**: "I like hiking and photography"
📅 **Date-specific**: "Events this weekend"
💰 **Price**: "Show me free events"

Just ask me anything about events!`;
    }

    if (lowerMessage.includes('tech') || lowerMessage.includes('technology')) {
      const techEvents = events.filter(e => e.category === 'tech').slice(0, 3);
      if (techEvents.length > 0) {
        return `I found ${techEvents.length} tech events for you:\n\n${techEvents.map(e => 
          `📅 **${e.title}**\n${new Date(e.date).toLocaleDateString()} at ${e.time}\n${e.price === 0 ? 'Free' : `$${e.price}`}`
        ).join('\n\n')}`;
      }
      return "I couldn't find any tech events at the moment. Would you like to create one?";
    }

    if (lowerMessage.includes('free')) {
      const freeEvents = events.filter(e => e.price === 0).slice(0, 3);
      if (freeEvents.length > 0) {
        return `Here are ${freeEvents.length} free events:\n\n${freeEvents.map(e => 
          `📅 **${e.title}**\n${new Date(e.date).toLocaleDateString()} - ${e.category}`
        ).join('\n\n')}`;
      }
      return "No free events found right now.";
    }

    if (lowerMessage.includes('today') || lowerMessage.includes('tonight')) {
      const today = new Date().toISOString().split('T')[0];
      const todayEvents = events.filter(e => e.date === today).slice(0, 3);
      if (todayEvents.length > 0) {
        return `Events happening today:\n\n${todayEvents.map(e => 
          `📅 **${e.title}**\n${e.time} - ${e.location?.placeName || e.location?.address}`
        ).join('\n\n')}`;
      }
      return "No events scheduled for today. Check out tomorrow's events!";
    }

    if (lowerMessage.includes('weekend') || lowerMessage.includes('saturday') || lowerMessage.includes('sunday')) {
      return `Let me find weekend events for you...

Based on what's available, here are some great options for the weekend! You can browse all events on the explore page.`;
    }

    if (lowerMessage.includes('create') || lowerMessage.includes('host')) {
      return `Great! You can create your own event by clicking the "Create Event" button. I can guide you through the process:

1. Choose a catchy title
2. Write a detailed description
3. Pick the right category
4. Set date, time, and location
5. Decide if it's free or paid

Would you like to create an event now?`;
    }

    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
      const recommendedEvents = events.slice(0, 3);
      if (recommendedEvents.length > 0) {
        return `Based on popular events, I recommend:\n\n${recommendedEvents.map(e => 
          `📅 **${e.title}**\n${e.category} • ${new Date(e.date).toLocaleDateString()}\n${e.rsvpList?.length || 0} people going`
        ).join('\n\n')}`;
      }
    }

    if (lowerMessage.includes('near') || lowerMessage.includes('nearby') || lowerMessage.includes('location')) {
      return `To show you nearby events, I'll need your location. You can browse events by location on the map view, where you can:

• See events on an interactive map
• Filter by distance (1km - 50km)
• View event details by clicking markers

Would you like to check out the map view?`;
    }

    // Default response
    return `I understand you're asking about "${userMessage}". While I'm still learning, I can help you:

• Find specific types of events
• Search by location or date
• Get recommendations
• Create new events

Try asking "Find tech events" or "What's happening this weekend?"`;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const botResponse = generateBotResponse(inputText);
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: botResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const quickActions = [
    { label: 'Find tech events', query: 'Find tech meetups near me' },
    { label: 'Free events', query: 'Show me free events' },
    { label: 'This weekend', query: 'What\'s happening this weekend?' },
    { label: 'Create event', query: 'Help me create an event' }
  ];

  const handleQuickAction = (query) => {
    setInputText(query);
  };

  return (
    <div className="chatbot-page">
      <div className="chatbot-container">
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <h1 className="chatbot-title">🤖 Event Assistant</h1>
            <p className="chatbot-subtitle">AI-powered event discovery</p>
          </div>
        </div>

        <div className="chatbot-messages">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.role === 'user' ? 'message-user' : 'message-assistant'}`}
            >
              <div className="message-avatar">
                {message.role === 'user' ? (
                  currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="You" />
                  ) : (
                    <div className="avatar-placeholder">
                      {currentUser.username?.charAt(0).toUpperCase()}
                    </div>
                  )
                ) : (
                  <div className="bot-avatar">🤖</div>
                )}
              </div>
              <div className="message-content">
                <div className="message-text">{message.content}</div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="message message-assistant">
              <div className="message-avatar">
                <div className="bot-avatar">🤖</div>
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chatbot-input-area">
          {messages.length <= 1 && (
            <div className="quick-actions">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.query)}
                  className="quick-action-btn"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="chatbot-input-form">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask me about events..."
              className="chatbot-input"
            />
            <button type="submit" className="send-btn" disabled={!inputText.trim()}>
              ➤
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;

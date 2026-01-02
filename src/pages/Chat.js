import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';
import { subscribeToTrips } from '../firebaseUtils';

function Chat({ currentUser }) {
  const [messagesByTrip, setMessagesByTrip] = useState({});
  // const [userTrips, setUserTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [readStatus, setReadStatus] = useState({});
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const emojis = ['😀', '😂', '😍', '🎉', '👍', '🔥', '✨', '🎈', '👌', '💯', '😎', '🤔', '😢', '😡', '🤗', '❤️'];

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 300;
          const maxHeight = 300;
          let width = img.width;
          let height = img.height;

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
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
      reader.onerror = reject;
    });
  };

  useEffect(() => {
    const savedReadStatus = JSON.parse(localStorage.getItem('messageReadStatus') || '{}');
    setReadStatus(savedReadStatus);
  }, []);

  // Subscribe to Firebase trips in real-time
  useEffect(() => {
    const unsubscribe = subscribeToTrips((firebaseTrips) => {
      if (!currentUser) {
        return;
      }

      // Filter trips where user is participant or host
      const myTrips = firebaseTrips.filter(trip => {
        const isParticipant = trip.participants && trip.participants.includes(currentUser.id || currentUser.uid);
        const isHost = trip.hostId === (currentUser.id || currentUser.uid);
        return isParticipant || isHost;
      });

      // setUserTrips(myTrips); // Not used, commenting out

      // Load messages from localStorage (grouped by trip)
      const tripMessages = JSON.parse(localStorage.getItem('tripMessages')) || {};
      let groupedMessages = {};

      myTrips.forEach(trip => {
        const tripId = trip.id;
        const messages = tripMessages[tripId] || [];
        const validMessages = messages.filter(msg => msg.tripId === tripId);

        groupedMessages[tripId] = {
          trip: trip,
          messages: validMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        };
      });

      setMessagesByTrip(groupedMessages);
      setLoading(false);

      // Clean up messages for deleted trips
      Object.keys(tripMessages).forEach(tripId => {
        if (!myTrips.find(t => t.id === tripId)) {
          delete tripMessages[tripId];
        }
      });
      localStorage.setItem('tripMessages', JSON.stringify(tripMessages));
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messagesByTrip, selectedTripId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTripId) return;

    const newMsg = {
      id: Date.now().toString(),
      userId: currentUser.id || currentUser.uid,
      username: currentUser.displayName || currentUser.username || 'User',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      tripId: selectedTripId,
      isImage: newMessage.includes('data:image/')
    };

    const tripMessages = JSON.parse(localStorage.getItem('tripMessages')) || {};
    if (!tripMessages[selectedTripId]) {
      tripMessages[selectedTripId] = [];
    }
    tripMessages[selectedTripId].push(newMsg);
    localStorage.setItem('tripMessages', JSON.stringify(tripMessages));

    setMessagesByTrip(prev => ({
      ...prev,
      [selectedTripId]: {
        ...prev[selectedTripId],
        messages: [...prev[selectedTripId].messages, newMsg]
      }
    }));

    setNewMessage('');
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);
  };

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
  };

  const handleLocationShare = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationMessage = `📍 Shared Location: https://maps.google.com/?q=${latitude},${longitude}`;
          setNewMessage(prev => prev + (prev ? '\n' : '') + locationMessage);
          setShowAttachmentMenu(false);
        },
        (error) => {
          alert('Could not access your location. Please enable location services.');
        }
      );
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedImage = await compressImage(file);
      setNewMessage(prev => prev + (prev ? '\n' : '') + compressedImage);
      setShowAttachmentMenu(false);
    } catch (error) {
      console.error('Image compression error:', error);
      alert('Could not upload image. Please try again.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBackToList = () => {
    setSelectedTripId(null);
    setNewMessage('');
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);
  };

  const markMessagesAsRead = (tripId) => {
    const newReadStatus = { ...readStatus, [tripId]: new Date().toISOString() };
    setReadStatus(newReadStatus);
    localStorage.setItem('messageReadStatus', JSON.stringify(newReadStatus));
  };

  const hasUnreadMessages = (tripId) => {
    const lastReadTime = readStatus[tripId] ? new Date(readStatus[tripId]) : new Date(0);
    const messages = messagesByTrip[tripId]?.messages || [];
    return messages.some(msg => new Date(msg.timestamp) > lastReadTime);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="chat-page">
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  const tripIds = Object.keys(messagesByTrip);
  const selectedTrip = selectedTripId ? messagesByTrip[selectedTripId] : null;

  // If a trip is selected, show full chat view
  if (selectedTrip) {
    return (
      <div className="container">
        <div className="chat-page full-chat">
          {/* Chat Header */}
          <div className="chat-full-header">
            <button onClick={handleBackToList} className="back-btn">← Back</button>
            <div className="header-info">
              <h2>{selectedTrip.trip.title}</h2>
              <p className="header-subtitle">{selectedTrip.messages.length} messages</p>
            </div>
          </div>

          {/* Messages */}
          <div className="messages-full">
            {selectedTrip.messages.length === 0 ? (
              <div className="empty-chat-full">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              selectedTrip.messages.map(msg => (
                <div 
                  key={msg.id} 
                  className={`message-full ${msg.username === (currentUser.displayName || currentUser.username) ? 'sent' : 'received'}`}
                >
                  {msg.username !== (currentUser.displayName || currentUser.username) && (
                    <span className="sender-name-full">{msg.username}</span>
                  )}
                  <div className="message-bubble-full">
                    {msg.isImage && msg.message.includes('data:image/') ? (
                      <img src={msg.message} alt="chat-image" className="chat-image" />
                    ) : (
                      <p>{msg.message}</p>
                    )}
                    <span className="time-full">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="emoji-picker-full">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => addEmoji(emoji)}
                  className="emoji-btn-full"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Attachment Menu */}
          {showAttachmentMenu && (
            <div className="attachment-menu-full">
              <button
                type="button"
                onClick={handleLocationShare}
                className="attachment-btn-full location"
              >
                📍 Location
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="attachment-btn-full image"
              >
                🖼️ Image
              </button>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="input-area-full">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="icon-btn-full emoji"
            >
              😊
            </button>
            <button
              type="button"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className="icon-btn-full attachment"
            >
              📎
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              maxLength="500"
              className="input-full"
              inputMode="text"
            />
            <button type="submit" className="send-btn-full" disabled={!newMessage.trim()}>
              ✈️
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </form>
        </div>
      </div>
    );
  }

  // Default view - List of conversations (WhatsApp style)
  return (
    <div className="container">
      <div className="chat-page">
        <div className="chat-list-header">
          <h1>💬 Messages</h1>
          <p className="chat-count">{tripIds.length} conversations</p>
        </div>

        {tripIds.length === 0 ? (
          <div className="empty-chats">
            <p>No messages yet. Join a trip and start chatting!</p>
          </div>
        ) : (
          <div className="conversations-list">
            {tripIds.map(tripId => {
              const { trip, messages } = messagesByTrip[tripId];
              const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
              const lastMessageTime = lastMessage 
                ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div key={tripId} className="conversation-item-wrapper">
                  <button
                    onClick={() => {
                      setSelectedTripId(tripId);
                      markMessagesAsRead(tripId);
                    }}
                    className="conversation-item"
                  >
                    <div className="conv-avatar">📍</div>
                    
                    <div className="conv-content">
                      <div className="conv-header">
                        <h3 className="conv-title">{trip.title}</h3>
                        <span className="conv-time">{lastMessageTime}</span>
                      </div>
                      
                      <p className="conv-preview">
                        {lastMessage 
                          ? `${lastMessage.username === (currentUser.displayName || currentUser.username) ? 'You: ' : ''}${lastMessage.message.substring(0, 60)}${lastMessage.message.length > 60 ? '...' : ''}`
                          : 'No messages yet'
                        }
                      </p>
                      
                      {messages.length > 0 && hasUnreadMessages(tripId) && (
                        <span className="msg-count">{messages.length}</span>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
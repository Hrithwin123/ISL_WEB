import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Send, MessageCircle, Video, VideoOff, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Conversations from '../components/Conversations';

export default function CameraChatApp() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { id: Date.now() + Math.random(), text: "Welcome to the ISL chat! Show hand signs to start communicating.", sender: 'system', timestamp: new Date() }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [currentGesture, setCurrentGesture] = useState(null);
  const [predictionConfidence, setPredictionConfidence] = useState(0);
  const [isPredicting, setIsPredicting] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationTitle, setConversationTitle] = useState('New Conversation');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const messagesEndRef = useRef(null);
  const predictionIntervalRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        streamRef.current = stream;
        setIsCameraOn(true);
        setCameraError('');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  const captureAndPredict = async () => {
    if (!videoRef.current || !token) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg');
    
    try {
      setIsPredicting(true);
      const response = await fetch('http://localhost:3000/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ image: imageData })
      });
      
      const result = await response.json();
      
      if (result.hand_detected && result.gesture) {
        setCurrentGesture(result.gesture);
        setPredictionConfidence(result.confidence);
        
        // Add to messages if confidence is high enough
        if (result.confidence > 0.7) {
          const newMessage = {
            id: Date.now() + Math.random(),
            text: `Detected: ${result.gesture} (${(result.confidence * 100).toFixed(1)}%)`,
            sender: 'system',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, newMessage]);
        }
      } else {
        setCurrentGesture(null);
        setPredictionConfidence(0);
      }
    } catch (error) {
      console.error('Prediction error:', error);
    } finally {
      setIsPredicting(false);
    }
  };

  const startPrediction = () => {
    if (predictionIntervalRef.current) {
      clearInterval(predictionIntervalRef.current);
    }
    predictionIntervalRef.current = setInterval(captureAndPredict, 2000); // Predict every 2 seconds
  };

  const stopPrediction = () => {
    if (predictionIntervalRef.current) {
      clearInterval(predictionIntervalRef.current);
      predictionIntervalRef.current = null;
    }
  };

  const sendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage = {
        id: Date.now() + Math.random(),
        text: inputMessage,
        sender: 'user',
        timestamp: new Date()
      };
      setMessages([...messages, newMessage]);
      setInputMessage('');
    }
  };

  const saveConversation = async () => {
    if (!token || messages.length <= 1) return; // Don't save if only welcome message

    try {
      const response = await fetch('http://localhost:3000/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: conversationTitle,
          messages: messages
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Conversation saved:', result);
        // Reset for new conversation
        setMessages([{ id: Date.now() + Math.random(), text: "New conversation started!", sender: 'system', timestamp: new Date() }]);
        setConversationTitle('New Conversation');
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const loadConversation = (conversation) => {
    if (conversation) {
      setMessages(conversation.messages || []);
      setConversationTitle(conversation.title);
      setSelectedConversation(conversation);
    } else {
      setMessages([{ id: Date.now() + Math.random(), text: "New conversation started!", sender: 'system', timestamp: new Date() }]);
      setConversationTitle('New Conversation');
      setSelectedConversation(null);
    }
    setShowConversations(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (predictionIntervalRef.current) {
        clearInterval(predictionIntervalRef.current);
      }
    };
  }, []);

  // Start prediction when camera is on
  useEffect(() => {
    if (isCameraOn) {
      startPrediction();
    } else {
      stopPrediction();
    }
  }, [isCameraOn]);

  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Camera Section */}
      <div className="w-1/2 p-6 flex flex-col">
        <div className="bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl h-full flex flex-col">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Camera className="w-6 h-6 text-purple-300" />
                </div>
                <h2 className="text-xl font-semibold text-white">Camera Feed</h2>
              </div>
              <div className="flex items-center gap-2">
                {/* Prediction Status */}
                {isCameraOn && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                    {isPredicting ? (
                      <div className="w-3 h-3 border-2 border-purple-300 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    )}
                    {currentGesture ? `${currentGesture} (${(predictionConfidence * 100).toFixed(1)}%)` : 'Ready'}
                  </div>
                )}
                <button
                  onClick={isCameraOn ? stopCamera : startCamera}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                    isCameraOn 
                      ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' 
                      : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                  }`}
                >
                  {isCameraOn ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  {isCameraOn ? 'Stop' : 'Start'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 flex items-center justify-center relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              width="640"
              height="480"
              style={{ border: '', zIndex: 1, position: 'absolute', height: "85%" }}
              onLoadedMetadata={() => videoRef.current?.play()}
              className="top-9 left-0"
            />
          
            {!isCameraOn && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-white text-center">
                <div className="flex flex-col items-center space-y-4 bg-gradient-to-br from-purple-900/50 to-black/40 backdrop-blur-lg rounded-2xl p-8 border border-purple-400/20 shadow-2xl">
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-500/30 rounded-full animate-pulse"></div>
                    <div className="relative p-4 bg-purple-600/20 rounded-full backdrop-blur-sm border border-purple-400/30">
                      <Video size={28} className="text-purple-100" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg font-medium text-purple-100">Camera Feed</div>
                    <div className="text-sm text-purple-200/70">Click Start to begin</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="px-6 pb-4 text-center text-red-400">{cameraError}</div>
          )}
        </div>
      </div>

      {/* Chat Section */}
      <div className="w-1/2 p-6 flex flex-col">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl h-full flex flex-col">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-blue-300" />
                </div>
                <h2 className="text-xl font-semibold text-white">Chat</h2>
                <div className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                  Online
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* User Info */}
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-sm">
                  <User className="w-4 h-4" />
                  <span>{user?.username || 'User'}</span>
                </div>
                {/* Conversations Button */}
                <button
                  onClick={() => setShowConversations(!showConversations)}
                  className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Conversation Title */}
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={conversationTitle}
                onChange={(e) => setConversationTitle(e.target.value)}
                className="bg-transparent text-purple-200 font-medium border-none outline-none"
                placeholder="Conversation title..."
              />
              <button
                onClick={saveConversation}
                className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs hover:bg-purple-500/30 transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-purple-500/20 text-purple-100 rounded-br-sm'
                      : message.sender === 'system'
                      ? 'bg-yellow-500/20 text-yellow-200'
                      : 'bg-blue-500/20 text-blue-100 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 border-t border-white/10">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim()}
                className="px-4 py-3 bg-purple-500/20 text-purple-300 rounded-xl hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conversations Sidebar */}
      {showConversations && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50">
          <div className="absolute right-0 top-0 h-full w-80 bg-black/20 backdrop-blur-lg border-l border-white/10 shadow-2xl">
            <Conversations 
              onSelectConversation={loadConversation}
              selectedConversation={selectedConversation}
            />
          </div>
        </div>
      )}
    </div>
  );
}

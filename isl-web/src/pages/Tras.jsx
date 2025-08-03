import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Send, MessageCircle, Video, VideoOff, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Conversations from '../components/Conversations';

// Simple spell checker implementation
class SimpleSpellChecker {
  constructor() {
    // Common English words for basic spell checking
    this.dictionary = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with',
      'hello', 'world', 'good', 'morning', 'afternoon', 'evening', 'night', 'day', 'week', 'month', 'year', 'time', 'work', 'play', 'eat', 'drink', 'sleep', 'walk', 'run', 'talk', 'listen', 'see', 'hear', 'feel', 'think', 'know', 'want', 'need', 'like', 'love', 'hate', 'help', 'please', 'thank', 'sorry', 'yes', 'no', 'maybe', 'okay', 'fine', 'great', 'bad', 'good', 'big', 'small', 'hot', 'cold', 'new', 'old', 'young', 'fast', 'slow', 'high', 'low', 'up', 'down', 'left', 'right', 'front', 'back', 'inside', 'outside', 'here', 'there', 'now', 'then', 'today', 'tomorrow', 'yesterday', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'their', 'our', 'we', 'you', 'they', 'me', 'him', 'us', 'them', 'i', 'am', 'do', 'can', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'have', 'had', 'has', 'been', 'being', 'get', 'got', 'getting', 'go', 'went', 'going', 'gone', 'come', 'came', 'coming', 'make', 'made', 'making', 'take', 'took', 'taking', 'taken', 'give', 'gave', 'giving', 'given', 'say', 'said', 'saying', 'tell', 'told', 'telling', 'see', 'saw', 'seeing', 'seen', 'look', 'looked', 'looking', 'find', 'found', 'finding', 'think', 'thought', 'thinking', 'know', 'knew', 'knowing', 'known', 'feel', 'felt', 'feeling', 'want', 'wanted', 'wanting', 'need', 'needed', 'needing', 'like', 'liked', 'liking', 'love', 'loved', 'loving', 'help', 'helped', 'helping', 'please', 'pleased', 'pleasing', 'thank', 'thanked', 'thanking', 'sorry', 'excuse', 'pardon', 'forgive', 'forgave', 'forgiving', 'forgiven'
    ]);
  }

  correction(word) {
    if (!word) return word;
    word = word.toLowerCase();
    
    // If word is in dictionary, return as is
    if (this.dictionary.has(word)) {
      return word;
    }
    
    // Simple correction logic - find closest word
    let bestMatch = word;
    let bestScore = 0;
    
    for (const dictWord of this.dictionary) {
      const score = this.levenshteinDistance(word, dictWord);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = dictWord;
      }
    }
    
    // Only correct if similarity is high enough
    const maxLength = Math.max(word.length, bestMatch.length);
    const similarity = (maxLength - this.levenshteinDistance(word, bestMatch)) / maxLength;
    
    return similarity > 0.7 ? bestMatch : word;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }
}

export default function CameraChatApp() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { id: Date.now() + Math.random(), text: "Welcome! Start the camera and begin signing.", sender: 'system', timestamp: new Date() }
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
  const spellChecker = useRef(new SimpleSpellChecker());

  // New state for word buffer and autocorrect
  const [wordBuffer, setWordBuffer] = useState('');
  const [predictionBuffer, setPredictionBuffer] = useState([]);
  const [lastPredictionTime, setLastPredictionTime] = useState(0);
  const [noHandStartTime, setNoHandStartTime] = useState(null);
  const [currentWord, setCurrentWord] = useState('');
  const [sentenceBuffer, setSentenceBuffer] = useState('');
  const [wordStartTime, setWordStartTime] = useState(null);

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

  const addToPredictionBuffer = (prediction) => {
    console.log('Adding to prediction buffer:', prediction);
    setPredictionBuffer(prev => {
      const newBuffer = [...prev, prediction];
      console.log('Updated prediction buffer:', newBuffer);
      if (newBuffer.length > 7) {
        return newBuffer.slice(-7);
      }
      return newBuffer;
    });
  };

  const getMostCommonPrediction = () => {
    console.log('Getting most common prediction. Buffer:', predictionBuffer, 'Length:', predictionBuffer.length);
    if (predictionBuffer.length === 0) {
      console.log('Buffer is empty, returning null');
      return null;
    }
    
    const counts = {};
    predictionBuffer.forEach(pred => {
      counts[pred] = (counts[pred] || 0) + 1;
    });
    
    let mostCommon = predictionBuffer[0];
    let maxCount = 1;
    
    for (const [pred, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = pred;
      }
    }
    
    console.log('Prediction counts:', counts, 'Most common:', mostCommon, 'Max count:', maxCount);
    return mostCommon;
  };

  const autocorrectWord = (word) => {
    if (!word) return word;
    return spellChecker.current.correction(word);
  };

  const completeWord = async (word) => {
    if (!word) return;
    
    console.log('Completing word:', word);
    const correctedWord = autocorrectWord(word);
    console.log('Corrected word:', correctedWord);
    
    setSentenceBuffer(prev => prev + correctedWord + ' ');
    setCurrentWord('');
    setPredictionBuffer([]);
    setWordStartTime(null);
    
    // Send completed word to backend
    try {
      console.log('Sending word to backend:', correctedWord);
      const response = await fetch('http://localhost:3000/api/words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          word: correctedWord,
          sentence: sentenceBuffer + correctedWord,
          confidence: predictionConfidence
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Word stored successfully:', result);
      } else {
        const errorData = await response.json();
        console.error('Failed to store word:', errorData);
      }
    } catch (error) {
      console.error('Error storing word:', error);
    }
    
    // Add the corrected word to chat
    const newMessage = {
      id: Date.now() + Math.random(),
      text: `Word: ${correctedWord}`,
      sender: 'system',
      timestamp: new Date()
    };
    console.log('Adding completed word message to chat:', newMessage);
    setMessages(prev => {
      const updatedMessages = [...prev, newMessage];
      console.log('Updated messages (completed word):', updatedMessages);
      return updatedMessages;
    });
  };

  const completeCurrentWord = async () => {
    if (currentWord) {
      await completeWord(currentWord);
    }
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
      
      console.log('Prediction result:', result);
      
      if (result.hand_detected && result.gesture) {
        setCurrentGesture(result.gesture);
        setPredictionConfidence(result.confidence);
        
        console.log('Hand detected, gesture:', result.gesture, 'confidence:', result.confidence);
        
        // Only process high-confidence predictions (>70%)
        if (result.confidence > 0.7) {
          addToPredictionBuffer(result.gesture);
          
          const currentTime = Date.now();
          const timeSinceLastPrediction = currentTime - lastPredictionTime;
          
          // Add letter to word buffer if prediction is stable (not the same as last letter)
          const smoothedPrediction = getMostCommonPrediction();
          console.log('Smoothed prediction:', smoothedPrediction, 'Current word:', currentWord, 'Last letter:', currentWord.slice(-1), 'Buffer length:', predictionBuffer.length);
          
          // Fallback: use the latest prediction if smoothed prediction is null
          const predictionToUse = smoothedPrediction || result.gesture;
          console.log('Prediction to use:', predictionToUse);
          
          if (predictionToUse && predictionToUse !== currentWord.slice(-1)) {
            console.log('Adding letter to word:', predictionToUse, 'Current word:', currentWord);
            setCurrentWord(prev => {
              const newWord = prev + predictionToUse;
              console.log('New word after adding letter:', newWord);
              // Start word timer if this is the first letter
              if (prev === '') {
                setWordStartTime(currentTime);
                console.log('Started word timer');
              }
              return newWord;
            });
            setLastPredictionTime(currentTime);
          } else if (predictionToUse && predictionToUse === currentWord.slice(-1)) {
            console.log('Same prediction as last letter, not adding:', predictionToUse);
          } else {
            console.log('No valid prediction to add. Prediction:', predictionToUse, 'Current word:', currentWord);
          }
          
          setNoHandStartTime(null); // Reset no-hand timer
        }
      } else {
        setCurrentGesture(null);
        setPredictionConfidence(0);
        
        // No hand detected - start timer for space addition
        if (noHandStartTime === null) {
          setNoHandStartTime(Date.now());
        } else {
          // Check if hand has been out of view for more than 0.5 seconds
          const timeSinceNoHand = Date.now() - noHandStartTime;
          if (timeSinceNoHand > 500 && currentWord) {
            // Complete the current word when hands are out of view
            await completeWord(currentWord);
            setNoHandStartTime(null);
          }
        }
        
        // Also complete word if it's getting too long (more than 5 letters) or has been in progress too long
        const shouldCompleteWord = currentWord && (
          currentWord.length >= 5 || 
          (wordStartTime && Date.now() - wordStartTime > 3000) // 3 seconds timeout
        );
        
        console.log('Word completion check:', {
          currentWord,
          wordLength: currentWord?.length,
          wordStartTime,
          timeSinceStart: wordStartTime ? Date.now() - wordStartTime : 'N/A',
          shouldComplete: shouldCompleteWord
        });
        
        if (shouldCompleteWord) {
          console.log('Completing word:', currentWord, 'Length:', currentWord.length, 'Time since start:', wordStartTime ? Date.now() - wordStartTime : 'N/A');
          await completeWord(currentWord);
        }
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
    // Don't save if no token
    if (!token) return;
    
    // Check if there are any meaningful messages (not just welcome message)
    const meaningfulMessages = messages.filter(msg => 
      msg.sender === 'user' || 
      (msg.sender === 'system' && msg.text.startsWith('Word:'))
    );
    
    console.log('All messages:', messages);
    console.log('Meaningful messages:', meaningfulMessages);
    
    if (meaningfulMessages.length === 0) {
      console.log('No meaningful messages to save');
      return;
    }

    try {
      console.log('Attempting to save conversation with title:', conversationTitle);
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
        console.log('Conversation saved successfully:', result);
        // Reset for new conversation
        setMessages([{ id: Date.now() + Math.random(), text: "New conversation started!", sender: 'system', timestamp: new Date() }]);
        setConversationTitle('New Conversation');
      } else {
        const errorData = await response.json();
        console.error('Failed to save conversation:', errorData);
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

  const handleConversationsToggle = () => {
    setShowConversations(!showConversations);
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
                
                {/* Word/Sentence Buffer Display */}
                {isCameraOn && (currentWord || sentenceBuffer) && (
                  <div className="flex flex-col gap-1 px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-sm">
                    {currentWord && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-200">Current:</span>
                        <span className="font-mono">{currentWord}</span>
                                      <button
                onClick={completeCurrentWord}
                className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs hover:bg-green-500/30 transition-colors"
              >
                Complete
              </button>
              <button
                onClick={() => {
                  // Test: Add a test word and complete it
                  setCurrentWord('HELLO');
                  setTimeout(() => completeCurrentWord(), 100);
                }}
                className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs hover:bg-blue-500/30 transition-colors"
              >
                Test Word
              </button>
              <button
                onClick={() => {
                  // Force complete current word
                  if (currentWord) {
                    console.log('Force completing word:', currentWord);
                    completeCurrentWord();
                  } else {
                    console.log('No current word to complete');
                  }
                }}
                className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs hover:bg-yellow-500/30 transition-colors"
              >
                Force Complete
              </button>
                      </div>
                    )}
                    {sentenceBuffer && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-200">Sentence:</span>
                        <span className="font-mono">{sentenceBuffer}</span>
                      </div>
                    )}
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
              className="top-9 left-0 rotate-y-180"
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
                  onClick={handleConversationsToggle}
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
                disabled={messages.filter(msg => msg.sender === 'user' || (msg.sender === 'system' && msg.text.startsWith('Word:'))).length === 0}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  messages.filter(msg => msg.sender === 'user' || (msg.sender === 'system' && msg.text.startsWith('Word:'))).length > 0
                    ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                    : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                }`}
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
            {/* Close Button */}
            <button
              onClick={() => setShowConversations(false)}
              className="absolute top-4 left-4 p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

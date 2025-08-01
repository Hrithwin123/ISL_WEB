# ISL Recognition System - Web Integration

This guide explains how to integrate the Indian Sign Language (ISL) recognition model with your React web interface.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Express Backend │    │  Flask ISL API  │
│   (Port 5173)   │◄──►│   (Port 3000)   │◄──►│   (Port 5001)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │    MongoDB      │
                       │   (Database)    │
                       └─────────────────┘
```

## 📁 File Structure

```
alpha/
├── isl_api.py                    # Flask API for ISL model inference
├── isl_cnn_model.keras/          # Your trained model
├── start_servers.py              # Startup script
├── requirements.txt              # Python dependencies
├── isl-web/                      # Your React frontend
│   ├── backend/
│   │   ├── server.js             # Express server (updated)
│   │   ├── isl-integration.js    # ISL API integration helper
│   │   ├── package.json          # Updated with new dependencies
│   │   └── env.example           # Environment variables template
│   └── src/
│       └── pages/
│           └── Tras.jsx          # Your camera chat component
└── INTEGRATION_README.md         # This file
```

## 🚀 Quick Start

### 1. Start the Flask ISL API

```bash
# From the alpha directory
python start_servers.py
```

This will:
- ✅ Check dependencies
- ✅ Verify model exists
- ✅ Start Flask API on port 5001
- 📋 Show next steps

### 2. Set up Express Backend

```bash
cd isl-web/backend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Start Express server
npm run dev
```

### 3. Start React Frontend

```bash
cd isl-web

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔧 Integration Components

### Flask ISL API (`isl_api.py`)

**Purpose**: Handles ISL model inference
**Port**: 5001
**Endpoints**:
- `POST /api/predict` - Process image and return gesture prediction
- `GET /api/health` - Health check

**Input**: Base64 encoded image
**Output**: 
```json
{
  "gesture": "A",
  "confidence": 0.95,
  "hand_detected": true,
  "message": "Prediction successful",
  "hand_bbox": [x1, y1, x2, y2]
}
```

### Express Backend (`server.js`)

**Purpose**: Authentication, database operations, API gateway
**Port**: 3000
**Features**:
- ✅ User authentication (JWT)
- ✅ MongoDB integration
- ✅ Conversation storage
- ✅ ISL API integration

**Endpoints**:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/predict` - ISL prediction (authenticated)
- `GET /api/conversations` - Get user conversations
- `POST /api/conversations` - Save conversation

### ISL Integration Helper (`isl-integration.js`)

**Purpose**: Bridge between Express and Flask APIs
**Functions**:
- `predictGesture(imageData)` - Send image to ISL API
- `checkISLHealth()` - Check ISL API status

## 🔐 Authentication Flow

1. **Register/Login** → Get JWT token
2. **Include token** in API requests: `Authorization: Bearer <token>`
3. **Express validates** token and forwards to Flask API
4. **Results stored** in MongoDB with user ID

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  createdAt: Date
}
```

### Conversations Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  title: String,
  messages: Array,
  createdAt: Date,
  updatedAt: Date
}
```

### Predictions Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  gesture: String,
  confidence: Number,
  timestamp: Date,
  handDetected: Boolean
}
```

## 🔄 Frontend Integration

### Update Your React Component

In your `Tras.jsx`, add ISL prediction functionality:

```javascript
// Add state for ISL prediction
const [currentGesture, setCurrentGesture] = useState(null);
const [predictionConfidence, setPredictionConfidence] = useState(0);

// Function to capture and predict
const captureAndPredict = async () => {
  if (!videoRef.current) return;
  
  const canvas = document.createElement('canvas');
  canvas.width = videoRef.current.videoWidth;
  canvas.height = videoRef.current.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoRef.current, 0, 0);
  
  const imageData = canvas.toDataURL('image/jpeg');
  
  try {
    const response = await fetch('http://localhost:3000/api/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Your JWT token
      },
      body: JSON.stringify({ image: imageData })
    });
    
    const result = await response.json();
    
    if (result.hand_detected && result.gesture) {
      setCurrentGesture(result.gesture);
      setPredictionConfidence(result.confidence);
      
      // Add to messages
      const newMessage = {
        id: messages.length + 1,
        text: `Detected: ${result.gesture} (${(result.confidence * 100).toFixed(1)}%)`,
        sender: 'system',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
    }
  } catch (error) {
    console.error('Prediction error:', error);
  }
};
```

## 🌐 Environment Variables

### Express Backend (.env)
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017
JWT_SECRET=your-super-secret-jwt-key
ISL_API_URL=http://localhost:5001
```

## 🛠️ Troubleshooting

### Common Issues

1. **Flask API not starting**
   - Check if model file exists
   - Verify Python dependencies: `pip install -r requirements.txt`

2. **Express backend connection error**
   - Check MongoDB is running
   - Verify environment variables in `.env`

3. **CORS errors**
   - Both servers have CORS enabled
   - Check if ports are correct

4. **Model loading error**
   - Ensure `isl_cnn_model.keras/` directory exists
   - Check model file permissions

### Health Checks

- **Flask API**: `http://localhost:5001/api/health`
- **Express API**: `http://localhost:3000/api/health`

## 📈 Performance Tips

1. **Image optimization**: Resize images before sending to API
2. **Batch processing**: Process multiple frames efficiently
3. **Caching**: Cache model predictions for similar gestures
4. **Error handling**: Implement retry logic for failed predictions

## 🔮 Next Steps

1. **Add real-time prediction** with WebSocket
2. **Implement gesture sequences** for words/phrases
3. **Add voice synthesis** for spoken output
4. **Create admin dashboard** for model monitoring
5. **Add user analytics** and usage statistics

## 📞 Support

If you encounter issues:
1. Check the console logs for both servers
2. Verify all dependencies are installed
3. Ensure MongoDB is running
4. Check network connectivity between services 
import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { MongoClient, ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { predictGesture, checkISLHealth } from './isl-integration.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

let db

// Connect to MongoDB
async function connectDB() {
    try {
        const client = new MongoClient(MONGODB_URI)
        await client.connect()
        db = client.db('isl-chat')
        console.log('Connected to MongoDB')
    } catch (error) {
        console.error('MongoDB connection error:', error)
    }
}

// Middleware
app.use(express.json({ limit: '50mb' }))
app.use(cors())

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        return res.status(401).json({ error: 'Access token required' })
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' })
        }
        req.user = user
        next()
    })
}

// Routes

// Health check
app.get('/api/health', async (req, res) => {
    const islHealth = await checkISLHealth()
    res.json({
        status: 'healthy',
        isl_api: islHealth,
        timestamp: new Date().toISOString()
    })
})

// Register user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' })
        }

        // Check if user already exists
        const existingUser = await db.collection('users').findOne({ email })
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)
        
        // Create user
        const user = {
            username,
            email,
            password: hashedPassword,
            createdAt: new Date()
        }
        
        await db.collection('users').insertOne(user)
        
        // Generate token
        const token = jwt.sign({ userId: user._id, email }, JWT_SECRET, { expiresIn: '24h' })
        
        res.status(201).json({ 
            message: 'User created successfully',
            token,
            user: { username, email }
        })
    } catch (error) {
        console.error('Registration error:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' })
        }

        // Find user
        const user = await db.collection('users').findOne({ email })
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }

        // Generate token
        const token = jwt.sign({ userId: user._id, email }, JWT_SECRET, { expiresIn: '24h' })
        
        res.json({ 
            message: 'Login successful',
            token,
            user: { username: user.username, email }
        })
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// ISL Prediction endpoint
app.post('/api/predict', authenticateToken, async (req, res) => {
    try {
        const { image } = req.body
        
        if (!image) {
            return res.status(400).json({ error: 'Image data required' })
        }

        const result = await predictGesture(image)
        
        // Only store high-confidence predictions (>70%)
        if (result.hand_detected && result.gesture && result.confidence > 0.7) {
            await db.collection('predictions').insertOne({
                userId: req.user.userId,
                gesture: result.gesture,
                confidence: result.confidence,
                timestamp: new Date(),
                handDetected: result.hand_detected
            })
        }

        res.json(result)
    } catch (error) {
        console.error('Prediction error:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// Store completed words/sentences
app.post('/api/words', authenticateToken, async (req, res) => {
    try {
        const { word, sentence, confidence } = req.body
        
        console.log('Received word storage request:', { word, sentence, confidence, userId: req.user.userId })
        
        if (!word) {
            console.log('No word provided in request');
            return res.status(400).json({ error: 'Word data required' })
        }

        const wordDoc = {
            userId: req.user.userId,
            word: word,
            sentence: sentence || '',
            confidence: confidence || 0,
            timestamp: new Date()
        }
        
        console.log('Storing word document:', wordDoc);
        const result = await db.collection('words').insertOne(wordDoc)
        console.log('Word stored with ID:', result.insertedId);

        res.json({ message: 'Word stored successfully', wordId: result.insertedId })
    } catch (error) {
        console.error('Word storage error:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// Get user's conversation history
app.get('/api/conversations', authenticateToken, async (req, res) => {
    try {
        const conversations = await db.collection('conversations')
            .find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray()
        
        res.json(conversations)
    } catch (error) {
        console.error('Error fetching conversations:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// Save conversation
app.post('/api/conversations', authenticateToken, async (req, res) => {
    try {
        const { messages, title } = req.body
        
        console.log('Saving conversation:', { title, messageCount: messages?.length, userId: req.user.userId })
        
        const conversation = {
            userId: req.user.userId,
            title: title || 'New Conversation',
            messages,
            createdAt: new Date(),
            updatedAt: new Date()
        }
        
        const result = await db.collection('conversations').insertOne(conversation)
        console.log('Conversation saved with ID:', result.insertedId)
        
        res.status(201).json({ 
            message: 'Conversation saved',
            conversationId: conversation._id
        })
    } catch (error) {
        console.error('Error saving conversation:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// Delete conversation
app.delete('/api/conversations/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params
        
        const result = await db.collection('conversations').deleteOne({
            _id: new ObjectId(id),
            userId: req.user.userId
        })
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Conversation not found' })
        }
        
        res.json({ message: 'Conversation deleted successfully' })
    } catch (error) {
        console.error('Error deleting conversation:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// Initialize database and start server
connectDB().then(() => {
    app.listen(PORT, () => console.log(`Express server listening on port ${PORT}`))
})

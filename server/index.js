// In server/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// --- IMPORT ROUTE FILES ---
const userRoutes = require('./routes/user.routes');
const eventRoutes = require('./routes/event.routes');
const certificateRoutes = require('./routes/certificate.routes');
const adminRoutes = require('./routes/admin.routes');
const authRoutes = require('./routes/auth.routes');
const verifierRoutes = require('./routes/verifier.routes');
const quizRoutes = require('./routes/quiz.routes');
const recommendationRoutes = require('./routes/recommendation.routes');
const poapRoutes = require('./routes/poap.routes'); // POAP routes

const app = express();
const PORT = process.env.PORT || 10000; 

// --- CORS CONFIGURATION (WHITELISTING FIX) ---
// IMPORTANT: This must list all domains that host your frontend.
const allowedOrigins = [
    'http://localhost:5173', // Local Dev
    'https://workingdemo.vercel.app', // Your new Vercel domain
    'https://the-blockchain-based-skill-credenti.vercel.app', // Your previous Vercel domain
];

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile/Postman) OR from the allowed list
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`CORS Blocked Origin: ${origin}`);
            callback(new Error('CORS policy denies access.'), false);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true 
}));


// --- DATABASE CONNECTION ---
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected successfully.');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1); 
    }
};
connectDB();

// --- TEST ROUTE ---
app.get('/', (req, res) => {
    res.status(200).send('CredentialChain API is Running!');
});

// --- REGISTER ROUTES ---
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/verifier', verifierRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/poap', poapRoutes); // POAP routes

// --- START SERVER ---
app.listen(PORT, '0.0.0.0', () => { // Bind to 0.0.0.0 for Render
    console.log(`🚀 Server is running on port ${PORT}`);
});
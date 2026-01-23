require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

// Create an Express app
// Think of this as creating a restaurant - we need a place to serve food (handle requests)
const app = express();

// Middleware setup
// Middleware is like assistants that help process requests before they reach our main handlers

// 1. CORS - Allows our frontend (React app) to talk to our backend
// It's like a bouncer that checks if the request is from an allowed place
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173', // Where our frontend is running
  credentials: true // Allow cookies to be sent
}));

// 2. Express JSON parser - Converts JSON data in requests to JavaScript objects
// When someone sends us data like {"name": "John"}, this turns it into a JavaScript object
app.use(express.json());

// 3. Express URL-encoded parser - Handles form data
// When someone submits a form, this processes it
app.use(express.urlencoded({ extended: true }));

// 4. Cookie parser - Reads cookies from requests
// Cookies are like little notes the browser sends with every request
// This middleware reads those notes so we can use them
app.use(cookieParser());

// Routes
// Routes are like different doors in our restaurant - each door leads to different functionality

// Auth routes - handles signup, signin, signout
// This is like having a "Registration Desk" door
app.use('/api/auth', authRoutes);

// Health check route - to test if server is running
// This is like a "We're Open" sign
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

// 404 handler - for routes that don't exist
// This is like a "This door doesn't exist" sign
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler - catches any errors that happen
// This is like a safety net that catches problems
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// Start the server
// This is like opening the restaurant for business
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth routes:`);
  console.log(`   POST http://localhost:${PORT}/api/auth/signup`);
  console.log(`   POST http://localhost:${PORT}/api/auth/signin`);
  console.log(`   POST http://localhost:${PORT}/api/auth/signout`);
});

module.exports = app;

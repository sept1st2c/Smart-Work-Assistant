const jwt = require('jsonwebtoken');

// This is like a secret password that only our server knows
// It's used to sign (create) and verify (check) our tokens
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // Token expires in 7 days

/**
 * Generate a JWT token for a user
 * Think of this like creating a special ID card that says "This person is logged in"
 * 
 * @param {string} userId - The user's ID from the database
 * @returns {string} - A signed JWT token
 */
function generateToken(userId) {
  // We create a token that contains the user's ID
  // This token is like a special stamp that proves the user is authenticated
  return jwt.sign(
    { userId }, // The data we want to store in the token
    JWT_SECRET, // Our secret key to sign it
    { expiresIn: JWT_EXPIRES_IN } // How long the token is valid
  );
}

/**
 * Set the JWT token as an HTTP-only cookie
 * HTTP-only means JavaScript can't access it (more secure!)
 * 
 * @param {object} res - Express response object
 * @param {string} token - The JWT token to set
 */
function setTokenCookie(res, token) {
  // We set a cookie with the token
  // httpOnly: true means JavaScript can't read it (prevents XSS attacks)
  // secure: true means it only works over HTTPS (use in production)
  // sameSite: 'strict' means it only works on our domain
  res.cookie('token', token, {
    httpOnly: true, // JavaScript can't access this cookie
    secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
    sameSite: 'strict', // Only send to same site
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/' // Available on all paths
  });
}

/**
 * Clear the token cookie (for logout)
 * 
 * @param {object} res - Express response object
 */
function clearTokenCookie(res) {
  // We delete the cookie by setting it with an expired date
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0), // Expire immediately
    path: '/'
  });
}

/**
 * Verify a JWT token and extract the user ID
 * This is like checking if an ID card is real and not expired
 * 
 * @param {string} token - The JWT token to verify
 * @returns {object|null} - The decoded token data or null if invalid
 */
function verifyToken(token) {
  try {
    // We check if the token is valid using our secret key
    // If it's valid, we get back the data (userId) we stored in it
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    // If the token is invalid, expired, or tampered with, return null
    return null;
  }
}

module.exports = {
  generateToken,
  setTokenCookie,
  clearTokenCookie,
  verifyToken
};

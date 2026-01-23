const { verifyToken } = require('../utils/jwt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Authentication Middleware
 * 
 * This is like a security guard that checks if you have a valid ID card (token) before letting you in
 * 
 * How it works:
 * 1. Get the token from the cookie
 * 2. Check if the token exists
 * 3. Verify if the token is valid (not expired, not tampered with)
 * 4. Find the user in the database
 * 5. Attach the user to the request so other parts of the app can use it
 * 6. If anything fails, say "you're not allowed in"
 */
async function authenticate(req, res, next) {
  try {
    // Step 1: Get the token from the cookie
    // Cookies are like little notes the browser sends with every request
    const token = req.cookies?.token;

    // Step 2: Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in.'
      });
    }

    // Step 3: Verify the token (check if it's valid and not expired)
    const decoded = verifyToken(token);

    if (!decoded) {
      // Token is invalid or expired
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please sign in again.'
      });
    }

    // Step 4: Find the user in the database using the userId from the token
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      // Don't include the password in the user object
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    // Step 5: Check if user still exists (maybe they were deleted)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please sign in again.'
      });
    }

    // Step 6: Attach the user to the request object
    // This way, any route handler after this middleware can access req.user
    req.user = user;

    // Step 7: Call next() to continue to the next middleware or route handler
    // It's like saying "this person is allowed, let them through"
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
}

module.exports = {
  authenticate
};

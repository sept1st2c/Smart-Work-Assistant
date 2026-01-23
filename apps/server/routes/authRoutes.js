const express = require('express');
const { body, validationResult } = require('express-validator');
const { signUp, signIn, signOut } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Validation middleware - checks if the data is in the right format
 * Think of this like a bouncer checking IDs before letting people in
 */
const validateSignUp = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(), // Converts "John@EXAMPLE.COM" to "john@example.com"
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const validateSignIn = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Helper function to check validation results
 * If validation fails, send error messages back
 */
function checkValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
}

/**
 * POST /api/auth/signup
 * 
 * This route is for creating a new account
 * It's like the "Create Account" button on a website
 * 
 * Flow:
 * 1. Validate the input (name, email, password)
 * 2. Call the signUp controller function
 * 3. Controller creates the user and sends back a response
 */
router.post('/signup', validateSignUp, checkValidation, signUp);

/**
 * POST /api/auth/signin
 * 
 * This route is for logging in
 * It's like the "Sign In" button on a website
 * 
 * Flow:
 * 1. Validate the input (email, password)
 * 2. Call the signIn controller function
 * 3. Controller checks credentials and sends back a response
 */
router.post('/signin', validateSignIn, checkValidation, signIn);

/**
 * POST /api/auth/signout
 * 
 * This route is for logging out
 * It's like the "Sign Out" button on a website
 * 
 * Flow:
 * 1. Check if user is authenticated (they must be logged in to log out)
 * 2. Call the signOut controller function
 * 3. Controller clears the cookie and sends back a response
 * 
 * Note: We use the authenticate middleware to make sure they're logged in
 * (You might want to allow signout even if not authenticated, but this is safer)
 */
router.post('/signout', authenticate, signOut);

module.exports = router;

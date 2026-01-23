const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateToken, setTokenCookie, clearTokenCookie } = require('../utils/jwt');

const prisma = new PrismaClient();

/**
 * Sign Up - Create a new user account
 * 
 * This is like creating a new account at a website:
 * 1. Check if email already exists (can't have two accounts with same email)
 * 2. Hash the password (turn "password123" into something like "a8f5f167f44f4964e6c998dee827110c")
 * 3. Save the user to the database
 * 4. Create a token and give it to them (auto-login after signup)
 */
async function signUp(req, res) {
  try {
    const { name, email, password } = req.body;

    // Step 1: Check if all required fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Step 2: Check if password is long enough (at least 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Step 3: Check if a user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Step 4: Hash the password (turn it into a scrambled version)
    // We use bcrypt to do this - it's like a one-way blender for passwords
    // You can't turn it back into the original password, but you can check if a password matches
    const saltRounds = 10; // How many times we scramble it (more = more secure but slower)
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Step 5: Create the new user in the database
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword // We store the hashed version, never the plain password!
      },
      // Don't send the password back to the client (even hashed)
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    // Step 6: Generate a token for the new user (auto-login)
    const token = generateToken(newUser.id);

    // Step 7: Set the token as an HTTP-only cookie
    setTokenCookie(res, token);

    // Step 8: Send success response
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Sign up error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Sign In - Log in an existing user
 * 
 * This is like logging into your account:
 * 1. Find the user by email
 * 2. Check if the password they entered matches the hashed password in the database
 * 3. If it matches, give them a token (log them in)
 * 4. If it doesn't match, say "wrong password"
 */
async function signIn(req, res) {
  try {
    const { email, password } = req.body;

    // Step 1: Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Step 2: Find the user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Step 3: If user doesn't exist, say "wrong email or password" (don't reveal if email exists)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Step 4: Compare the entered password with the hashed password in database
    // bcrypt.compare is like checking if two scrambled eggs came from the same original egg
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // Step 5: If password doesn't match, reject
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Step 6: Password is correct! Generate a token
    const token = generateToken(user.id);

    // Step 7: Set the token as an HTTP-only cookie
    setTokenCookie(res, token);

    // Step 8: Send success response (don't send password!)
    res.status(200).json({
      success: true,
      message: 'Signed in successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Sign Out - Log out the current user
 * 
 * This is like logging out:
 * 1. Clear the token cookie (delete it)
 * 2. Tell the user they're logged out
 * 
 * Note: We don't need to check anything because we just delete the cookie
 */
async function signOut(req, res) {
  try {
    // Clear the token cookie (delete it from the browser)
    clearTokenCookie(res);

    // Send success response
    res.status(200).json({
      success: true,
      message: 'Signed out successfully'
    });
  } catch (error) {
    console.error('Sign out error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

module.exports = {
  signUp,
  signIn,
  signOut
};

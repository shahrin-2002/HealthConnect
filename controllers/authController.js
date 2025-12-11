/**
 * Auth Controller - Handles authentication business logic
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthController {
  /**
   * User registration
   */
  async signup(req, res) {
    try {
      const { name, email, password, role, phone, address, gender, date_of_birth } = req.body;

      // Validation
      if (!name || !email || !password || !role) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Name, email, password, and role are required'
        });
      }

      // Validate role
      const validRoles = ['patient', 'doctor', 'admin'];
      if (!validRoles.includes(role.toLowerCase())) {
        return res.status(400).json({
          error: 'Invalid Role',
          message: 'Role must be one of: patient, doctor, admin'
        });
      }

      // Check if email already exists
      const emailExists = await User.emailExists(email);
      if (emailExists) {
        return res.status(409).json({
          error: 'Email Already Exists',
          message: 'A user with this email already exists'
        });
      }

      // Create user (password will be hashed automatically by the pre-save hook)
      const newUser = await User.create({
        name,
        email,
        password,
        role: role.toLowerCase(),
        phone,
        address,
        gender,
        date_of_birth
      });

      // Convert to JSON to remove password
      const userResponse = newUser.toJSON();

      res.status(201).json({
        message: 'User registered successfully',
        user: userResponse
      });

    } catch (error) {
      console.error('Signup error:', error);

      // Handle Mongoose validation errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Validation Error',
          message: Object.values(error.errors).map(e => e.message).join(', ')
        });
      }

      // Handle duplicate email error
      if (error.code === 11000) {
        return res.status(409).json({
          error: 'Email Already Exists',
          message: 'A user with this email already exists'
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred during registration'
      });
    }
  }

  /**
   * User login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Email and password are required'
        });
      }

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: 'Authentication Failed',
          message: 'Invalid email or password'
        });
      }

      // Verify password using the comparePassword method
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Authentication Failed',
          message: 'Invalid email or password'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Return token and user info (without password)
      const userResponse = user.toJSON();

      res.status(200).json({
        message: 'Login successful',
        token,
        user: userResponse
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred during login'
      });
    }
  }

  /**
   * Get user profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User Not Found',
          message: 'User profile not found'
        });
      }

      // Convert to JSON to remove password
      const userResponse = user.toJSON();

      res.status(200).json({
        message: 'Profile retrieved successfully',
        user: userResponse
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred while fetching profile'
      });
    }
  }
}

module.exports = AuthController;

/**
 * Auth Controller - Handles authentication business logic
 * Updated: Automatically creates Doctor Profile upon registration
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const sendEmail = require('../utils/emailService');

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

      // Create user
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

      // AUTOMATIC DOCTOR PROFILE CREATION
      if (role.toLowerCase() === 'doctor') {
        try {
          // 1. Assign to a default hospital (First one found in DB)
          let hospital = await Hospital.findOne();

          // Edge case: If no hospitals exist yet, create a dummy one
          if (!hospital) {
            hospital = await Hospital.create({
              name: "General City Hospital",
              city: "Dhaka",
              location: "123 Main St",
              phone: "555-0100",
              email: "admin@hospital.com"
            });
          }

          // 2. Create the linked Doctor Profile
          await Doctor.create({
            user_id: newUser._id,
            hospital_id: hospital._id,
            name: newUser.name,
            specialization: "General Physician", // Default specialization
            consultation_fee: 500,               // Default fee
            availability_status: "Available",
            phone: newUser.phone,
            email: newUser.email,
            slotDuration: 30,                    // Default slot duration
            availability: []                     // Empty schedule initially
          });

          console.log(`Auto-created Doctor Profile for ${newUser.name}`);
        } catch (docError) {
          console.error('Failed to auto-create doctor profile:', docError);
          // Note: We don't stop the registration here, but we log the error.
        }
      }

      // Convert to JSON to remove password
      const userResponse = newUser.toJSON();

      res.status(201).json({
        message: 'User registered successfully',
        user: userResponse
      });

    } catch (error) {
      console.error('Signup error:', error);

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Validation Error',
          message: Object.values(error.errors).map(e => e.message).join(', ')
        });
      }

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
   * User login - Email + Password (no OTP)
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Validation Error', message: 'Email and password are required' });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Auth Failed', message: 'Invalid credentials' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Auth Failed', message: 'Invalid credentials' });
      }

      // Generate token directly - no OTP
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Build user response
      const userResponse = user.toJSON();

      // If doctor, include the Doctor profile ID
      if (user.role === 'doctor') {
        const doctorProfile = await Doctor.findOne({ user_id: user._id });
        if (doctorProfile) {
          userResponse.doctorId = doctorProfile._id;
        }
      }

      return res.status(200).json({
        message: 'Login successful',
        token,
        user: userResponse
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server Error', message: error.message });
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
        return res.status(404).json({ error: 'User Not Found', message: 'User profile not found' });
      }

      // Build user response
      const userResponse = user.toJSON();

      // If doctor, include the Doctor profile ID
      if (user.role === 'doctor') {
        const doctorProfile = await Doctor.findOne({ user_id: user._id });
        if (doctorProfile) {
          userResponse.doctorId = doctorProfile._id;
        }
      }

      res.status(200).json({ message: 'Profile retrieved successfully', user: userResponse });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred while fetching profile' });
    }
  }

  /**
   * Verify OTP
   */
  async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ error: 'Validation Error', message: 'Email and OTP required' });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'Not Found', message: 'User not found' });
      }

      if (user.otp !== otp || user.otpExpires < Date.now()) {
        return res.status(400).json({ error: 'Invalid OTP', message: 'Code is invalid or expired' });
      }

      user.otp = null;
      user.otpExpires = null;
      await user.save();

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Build user response
      const userResponse = user.toJSON();

      // If doctor, include the Doctor profile ID
      if (user.role === 'doctor') {
        const doctorProfile = await Doctor.findOne({ user_id: user._id });
        if (doctorProfile) {
          userResponse.doctorId = doctorProfile._id;
        }
      }

      res.status(200).json({
        message: 'Login successful',
        token,
        user: userResponse
      });

    } catch (error) {
      console.error('OTP Verify error:', error);
      res.status(500).json({ error: 'Server Error', message: error.message });
    }
  }
}

module.exports = AuthController;

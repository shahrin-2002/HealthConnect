/**
 * Authentication Routes - MVC Pattern
 * Clean routes that delegate to controller
 */

const express = require('express');
const AuthController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Initialize controller
const initAuthRoutes = () => {
  const authController = new AuthController();
  router.post('/verify-otp', (req, res) => authController.verifyOtp(req, res));

  /**
   * POST /api/auth/signup
   * Register a new user (Patient, Doctor, or Admin)
   */
  router.post('/signup', (req, res) => authController.signup(req, res));

  /**
   * POST /api/auth/login
   * Authenticate user and return JWT token
   */
  router.post('/login', (req, res) => authController.login(req, res));

  /**
   * GET /api/auth/profile
   * Get current user profile (requires authentication)
   */
  router.get('/profile', verifyToken, (req, res) => authController.getProfile(req, res));

  return router;
};

module.exports = initAuthRoutes;

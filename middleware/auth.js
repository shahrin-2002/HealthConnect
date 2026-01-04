/**
 * Authentication Middleware
 * Handles JWT token verification and role-based access control
 */

const jwt = require('jsonwebtoken');

/**
 * Verify JWT Token
 * Checks if the request has a valid JWT token in the Authorization header
 */
const verifyToken = (req, res, next) => {
  // Extract token from Authorization header (format: "Bearer token")
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No token provided. Please include Authorization header with Bearer token.'
    });
  }

  // Extract the token (remove "Bearer " prefix)
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token format. Use: Authorization: Bearer <token>'
    });
  }

  try {
    // Verify the token using JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request object for use in route handlers
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Role-Based Access Control Middleware
 * Checks if the user has the required role to access the endpoint
 * @param {string|string[]} allowedRoles - Role(s) that are allowed to access the endpoint
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // Convert single role to array for consistency
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Check if user's role is in the allowed roles list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`
      });
    }

    next();
  };
};

/**
 * Admin Role Check Middleware
 * Shorthand for checking if user is a Hospital Admin
 */
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'Hospital_Admin' && req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

module.exports = {
  verifyToken,
  checkRole,
  authenticateToken: verifyToken, // Alias for clarity
  isAdmin
};

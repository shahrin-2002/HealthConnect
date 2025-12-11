/**
 * Doctor Routes
 * Handles doctor directory endpoints with search and filter functionality
 */

const express = require('express');
const { verifyToken, checkRole } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/doctors
 * Get all doctors with search and filter functionality
 *
 * Query Parameters (optional):
 * - search: Search by doctor name
 * - specialization: Filter by specialization (e.g., Cardiology, Orthopedics)
 * - hospital_id: Filter by hospital ID
 * - availability_status: Filter by status (Available, Busy, On_Leave)
 * - limit: Number of results (default: 10)
 * - offset: Pagination offset (default: 0)
 *
 * Example: GET /api/doctors?specialization=Cardiology&hospital_id=1&limit=5
 */
router.get('/', async (req, res) => {
  try {
    const { search, specialization, hospital_id, availability_status, limit = 10, offset = 0 } = req.query;

    const connection = await req.pool.getConnection();

    try {
      let query = `
        SELECT d.id, u.name, d.specialization, d.experience_years, d.consultation_fee,
               d.availability_status, d.license_number, d.qualifications, d.created_at,
               h.name as hospital_name, h.id as hospital_id
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        JOIN hospitals h ON d.hospital_id = h.id
        WHERE 1=1
      `;
      const params = [];

      // Add search filter (searches by doctor name)
      if (search) {
        query += ' AND u.name LIKE ?';
        params.push(`%${search}%`);
      }

      // Add specialization filter
      if (specialization) {
        query += ' AND d.specialization = ?';
        params.push(specialization);
      }

      // Add hospital filter
      if (hospital_id) {
        query += ' AND d.hospital_id = ?';
        params.push(hospital_id);
      }

      // Add availability status filter
      if (availability_status) {
        query += ' AND d.availability_status = ?';
        params.push(availability_status);
      }

      // Add limit and offset for pagination
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      // Execute query
      const [doctors] = await connection.query(query, params);

      // Get total count for pagination info
      let countQuery = `
        SELECT COUNT(*) as total FROM doctors d
        JOIN users u ON d.user_id = u.id
        JOIN hospitals h ON d.hospital_id = h.id
        WHERE 1=1
      `;
      const countParams = [];

      if (search) {
        countQuery += ' AND u.name LIKE ?';
        countParams.push(`%${search}%`);
      }
      if (specialization) {
        countQuery += ' AND d.specialization = ?';
        countParams.push(specialization);
      }
      if (hospital_id) {
        countQuery += ' AND d.hospital_id = ?';
        countParams.push(hospital_id);
      }
      if (availability_status) {
        countQuery += ' AND d.availability_status = ?';
        countParams.push(availability_status);
      }

      const [countResult] = await connection.query(countQuery, countParams);
      const total = countResult[0].total;

      res.status(200).json({
        message: 'Doctors retrieved successfully',
        total,
        count: doctors.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        data: doctors
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/doctors/:id
 * Get doctor details by ID
 *
 * URL Parameters:
 * - id: Doctor ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await req.pool.getConnection();

    try {
      // Fetch doctor by ID with hospital and user info
      const [doctors] = await connection.query(
        `SELECT d.id, u.name, u.email, u.phone, u.address, d.specialization,
                d.experience_years, d.consultation_fee, d.availability_status,
                d.license_number, d.qualifications, d.created_at,
                h.name as hospital_name, h.id as hospital_id, h.location, h.city
         FROM doctors d
         JOIN users u ON d.user_id = u.id
         JOIN hospitals h ON d.hospital_id = h.id
         WHERE d.id = ?`,
        [id]
      );

      if (doctors.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Doctor not found'
        });
      }

      res.status(200).json({
        message: 'Doctor details retrieved successfully',
        data: doctors[0]
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * POST /api/doctors
 * Create a new doctor (Hospital Admin only)
 *
 * Authorization: Requires JWT token with Hospital_Admin role
 *
 * Request Body:
 * {
 *   "user_id": 2,
 *   "hospital_id": 1,
 *   "specialization": "Cardiology",
 *   "license_number": "LIC123456789",
 *   "experience_years": 10,
 *   "qualifications": "MBBS, MD (Cardiology)",
 *   "consultation_fee": 500.00,
 *   "availability_status": "Available"
 * }
 */
router.post('/', verifyToken, checkRole('Hospital_Admin'), async (req, res) => {
  try {
    const { user_id, hospital_id, specialization, license_number, experience_years, qualifications, consultation_fee, availability_status } = req.body;

    // Validate required fields
    if (!user_id || !hospital_id || !specialization) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'user_id, hospital_id, and specialization are required'
      });
    }

    const connection = await req.pool.getConnection();

    try {
      // Check if user exists and is a Doctor
      const [users] = await connection.query(
        'SELECT id, role FROM users WHERE id = ?',
        [user_id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found'
        });
      }

      if (users[0].role !== 'Doctor') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'User must have Doctor role'
        });
      }

      // Check if hospital exists
      const [hospitals] = await connection.query(
        'SELECT id FROM hospitals WHERE id = ?',
        [hospital_id]
      );

      if (hospitals.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Hospital not found'
        });
      }

      // Check if doctor already registered at this hospital
      const [existingDoctors] = await connection.query(
        'SELECT id FROM doctors WHERE user_id = ? AND hospital_id = ?',
        [user_id, hospital_id]
      );

      if (existingDoctors.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Doctor is already registered at this hospital'
        });
      }

      // Check if license number is unique
      if (license_number) {
        const [licenseExists] = await connection.query(
          'SELECT id FROM doctors WHERE license_number = ?',
          [license_number]
        );

        if (licenseExists.length > 0) {
          return res.status(409).json({
            error: 'Conflict',
            message: 'License number already exists'
          });
        }
      }

      // Insert new doctor
      const [result] = await connection.query(
        `INSERT INTO doctors (user_id, hospital_id, specialization, license_number, experience_years, qualifications, consultation_fee, availability_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, hospital_id, specialization, license_number || null, experience_years || 0, qualifications || null, consultation_fee || 0, availability_status || 'Available']
      );

      res.status(201).json({
        message: 'Doctor registered successfully',
        doctor: {
          id: result.insertId,
          user_id,
          hospital_id,
          specialization,
          license_number,
          experience_years,
          qualifications,
          consultation_fee,
          availability_status: availability_status || 'Available'
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create doctor error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * PUT /api/doctors/:id
 * Update doctor details (Hospital Admin only)
 *
 * Authorization: Requires JWT token with Hospital_Admin role
 *
 * URL Parameters:
 * - id: Doctor ID
 *
 * Request Body: Any fields to update
 * {
 *   "specialization": "Orthopedics",
 *   "availability_status": "On_Leave",
 *   "consultation_fee": 600.00
 * }
 */
router.put('/:id', verifyToken, checkRole('Hospital_Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent updating critical fields
    delete updates.user_id;
    delete updates.hospital_id;
    delete updates.id;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No fields to update'
      });
    }

    const connection = await req.pool.getConnection();

    try {
      // Check if doctor exists
      const [doctors] = await connection.query(
        'SELECT id FROM doctors WHERE id = ?',
        [id]
      );

      if (doctors.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Doctor not found'
        });
      }

      // Build dynamic UPDATE query
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(updates), id];

      await connection.query(
        `UPDATE doctors SET ${setClause} WHERE id = ?`,
        values
      );

      res.status(200).json({
        message: 'Doctor updated successfully',
        doctor: {
          id: parseInt(id),
          ...updates
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

module.exports = router;

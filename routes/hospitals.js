/**
 * Hospital Routes
 * Handles hospital directory endpoints with search and filter functionality
 */

const express = require('express');
const { verifyToken, checkRole } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/hospitals
 * Get all hospitals with search and filter functionality
 *
 * Query Parameters (optional):
 * - search: Search by hospital name
 * - city: Filter by city
 * - specialization: Filter by specialization
 * - limit: Number of results (default: 10)
 * - offset: Pagination offset (default: 0)
 *
 * Example: GET /api/hospitals?search=Apollo&city=Mumbai&limit=5
 */
router.get('/', async (req, res) => {
  try {
    const { search, city, specialization, limit = 10, offset = 0 } = req.query;

    const connection = await req.pool.getConnection();

    try {
      let query = 'SELECT * FROM hospitals WHERE 1=1';
      const params = [];

      // Add search filter (searches by hospital name)
      if (search) {
        query += ' AND name LIKE ?';
        params.push(`%${search}%`);
      }

      // Add city filter
      if (city) {
        query += ' AND city = ?';
        params.push(city);
      }

      // Add specialization filter
      if (specialization) {
        query += ' AND specializations LIKE ?';
        params.push(`%${specialization}%`);
      }

      // Add limit and offset for pagination
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      // Execute query
      const [hospitals] = await connection.query(query, params);

      // Get total count for pagination info
      let countQuery = 'SELECT COUNT(*) as total FROM hospitals WHERE 1=1';
      const countParams = [];

      if (search) {
        countQuery += ' AND name LIKE ?';
        countParams.push(`%${search}%`);
      }
      if (city) {
        countQuery += ' AND city = ?';
        countParams.push(city);
      }
      if (specialization) {
        countQuery += ' AND specializations LIKE ?';
        countParams.push(`%${specialization}%`);
      }

      const [countResult] = await connection.query(countQuery, countParams);
      const total = countResult[0].total;

      res.status(200).json({
        message: 'Hospitals retrieved successfully',
        total,
        count: hospitals.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        data: hospitals
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/hospitals/:id
 * Get hospital details by ID
 *
 * URL Parameters:
 * - id: Hospital ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await req.pool.getConnection();

    try {
      // Fetch hospital by ID
      const [hospitals] = await connection.query(
        'SELECT * FROM hospitals WHERE id = ?',
        [id]
      );

      if (hospitals.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Hospital not found'
        });
      }

      const hospital = hospitals[0];

      // Get doctors working at this hospital
      const [doctors] = await connection.query(
        `SELECT d.id, u.name, d.specialization, d.experience_years, d.consultation_fee, d.availability_status
         FROM doctors d
         JOIN users u ON d.user_id = u.id
         WHERE d.hospital_id = ?`,
        [id]
      );

      res.status(200).json({
        message: 'Hospital details retrieved successfully',
        data: {
          ...hospital,
          doctors: doctors
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get hospital error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * POST /api/hospitals
 * Create a new hospital (Hospital Admin only)
 *
 * Authorization: Requires JWT token with Hospital_Admin role
 *
 * Request Body:
 * {
 *   "name": "Apollo Hospital",
 *   "location": "123 Medical Complex",
 *   "city": "Mumbai",
 *   "state": "Maharashtra",
 *   "pincode": "400001",
 *   "phone": "9876543210",
 *   "email": "admin@apollo.com",
 *   "specializations": "Cardiology, Orthopedics, Neurology",
 *   "description": "Leading multi-specialty hospital",
 *   "beds_total": 500
 * }
 */
router.post('/', verifyToken, checkRole('Hospital_Admin'), async (req, res) => {
  try {
    const { name, location, city, state, pincode, phone, email, specializations, description, beds_total } = req.body;

    // Validate required fields
    if (!name || !location || !city) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'name, location, and city are required'
      });
    }

    const connection = await req.pool.getConnection();

    try {
      // Check if hospital with same email already exists
      if (email) {
        const [existingHospitals] = await connection.query(
          'SELECT id FROM hospitals WHERE email = ?',
          [email]
        );

        if (existingHospitals.length > 0) {
          return res.status(409).json({
            error: 'Conflict',
            message: 'Hospital with this email already exists'
          });
        }
      }

      // Insert new hospital
      const [result] = await connection.query(
        `INSERT INTO hospitals (name, location, city, state, pincode, phone, email, specializations, description, beds_total, admin_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, location, city, state || null, pincode || null, phone || null, email || null, specializations || null, description || null, beds_total || 0, req.user.id]
      );

      res.status(201).json({
        message: 'Hospital created successfully',
        hospital: {
          id: result.insertId,
          name,
          location,
          city,
          state,
          pincode,
          phone,
          email,
          specializations,
          description,
          beds_total,
          admin_id: req.user.id
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create hospital error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * PUT /api/hospitals/:id
 * Update hospital details (Hospital Admin only)
 *
 * Authorization: Requires JWT token with Hospital_Admin role
 *
 * URL Parameters:
 * - id: Hospital ID
 *
 * Request Body: Any fields to update
 * {
 *   "name": "Apollo Hospital Updated",
 *   "phone": "9876543211",
 *   "beds_total": 550
 * }
 */
router.put('/:id', verifyToken, checkRole('Hospital_Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent updating admin_id
    delete updates.admin_id;
    delete updates.id;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No fields to update'
      });
    }

    const connection = await req.pool.getConnection();

    try {
      // Check if hospital exists
      const [hospitals] = await connection.query(
        'SELECT id, admin_id FROM hospitals WHERE id = ?',
        [id]
      );

      if (hospitals.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Hospital not found'
        });
      }

      // Check if user is the admin of this hospital
      if (hospitals[0].admin_id !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only update hospitals you manage'
        });
      }

      // Build dynamic UPDATE query
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(updates), id];

      await connection.query(
        `UPDATE hospitals SET ${setClause} WHERE id = ?`,
        values
      );

      res.status(200).json({
        message: 'Hospital updated successfully',
        hospital: {
          id: parseInt(id),
          ...updates
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update hospital error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
});

module.exports = router;

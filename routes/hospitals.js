/**
 * Hospital Routes - MongoDB Version
 */

const express = require('express');
const { verifyToken, checkRole } = require('../middleware/auth');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');

const router = express.Router();

/**
 * GET /api/hospitals
 * Get all hospitals with search and filter
 */
router.get('/', async (req, res) => {
  try {
    const { search, city, specialization, limit = 10, offset = 0 } = req.query;

    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }
    if (specialization) {
      query.specializations = { $regex: specialization, $options: 'i' };
    }

    const total = await Hospital.countDocuments(query);
    const hospitals = await Hospital.find(query)
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Hospitals retrieved successfully',
      total,
      count: hospitals.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      data: hospitals
    });
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

/**
 * GET /api/hospitals/:id
 * Get hospital details by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({ error: 'Not Found', message: 'Hospital not found' });
    }

    // Get doctors at this hospital
    const doctors = await Doctor.find({ hospital_id: hospital._id });

    res.status(200).json({
      message: 'Hospital details retrieved successfully',
      data: {
        ...hospital.toObject(),
        doctors
      }
    });
  } catch (error) {
    console.error('Get hospital error:', error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

/**
 * POST /api/hospitals
 * Create a new hospital (Admin only)
 */
router.post('/', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { name, location, city, state, pincode, phone, email, specializations, description, beds_total } = req.body;

    if (!name || !location || !city) {
      return res.status(400).json({ error: 'Bad Request', message: 'name, location, and city are required' });
    }

    const hospital = await Hospital.create({
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
    });

    res.status(201).json({ message: 'Hospital created successfully', hospital });
  } catch (error) {
    console.error('Create hospital error:', error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

/**
 * PUT /api/hospitals/:id
 * Update hospital (Admin only)
 */
router.put('/:id', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.admin_id;
    delete updates._id;

    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!hospital) {
      return res.status(404).json({ error: 'Not Found', message: 'Hospital not found' });
    }

    res.status(200).json({ message: 'Hospital updated successfully', hospital });
  } catch (error) {
    console.error('Update hospital error:', error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

module.exports = router;

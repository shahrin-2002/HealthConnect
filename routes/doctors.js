/**
 * Doctor Routes - MongoDB Version
 * Combined: Existing Search/Filter + New Availability Logic
 */

const express = require('express');
const { verifyToken, checkRole } = require('../middleware/auth');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');

const router = express.Router();

/**
 * GET /api/doctors
 * Get all doctors with search and filter
 */
router.get('/', async (req, res) => {
  try {
    const { search, specialization, hospital_id, availability_status, limit = 10, offset = 0 } = req.query;

    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }
    if (hospital_id) {
      query.hospital_id = hospital_id;
    }
    if (availability_status) {
      query.availability_status = availability_status;
    }

    const total = await Doctor.countDocuments(query);
    const doctors = await Doctor.find(query)
      .populate('hospital_id', 'name city')
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Transform to include hospital_name
    const transformedDoctors = doctors.map(doc => ({
      ...doc.toObject(),
      hospital_name: doc.hospital_id?.name,
      city: doc.hospital_id?.city
    }));

    res.status(200).json({
      message: 'Doctors retrieved successfully',
      total,
      count: doctors.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      data: transformedDoctors
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

/**
 * GET /api/doctors/profile/me
 * Get logged-in doctor's own profile (for Manage Schedule page)
 * Placed BEFORE /:id to prevent conflict
 */
router.get('/profile/me', verifyToken, checkRole('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user_id: req.user.id });
    if (!doctor) return res.status(404).json({ error: 'Doctor profile not found' });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/doctors/availability/me
 * Update logged-in doctor's availability
 */
router.put('/availability/me', verifyToken, checkRole('doctor'), async (req, res) => {
  try {
    const { slotDuration, availability } = req.body;

    // Find doctor linked to the logged-in user
    const doctor = await Doctor.findOne({ user_id: req.user.id });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found. Please contact admin to link your profile.' });
    }

    doctor.slotDuration = slotDuration;
    doctor.availability = availability;
    await doctor.save();

    res.json({ message: 'Schedule updated successfully', doctor });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/doctors/:id/slots
 * Get available slots for a specific date
 */
router.get('/:id/slots', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query; // Format YYYY-MM-DD

    if (!date) return res.status(400).json({ error: 'Date is required' });

    const doctor = await Doctor.findById(id);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    // 1. Find the day of the week
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

    // 2. Check if doctor works on this day
    const schedule = doctor.availability?.find(s => s.day === dayOfWeek && s.isAvailable);

    if (!schedule) {
      return res.json({ date, slots: [], message: 'Doctor is not available on this day' });
    }

    // 3. Generate slots
    const slots = [];
    const duration = doctor.slotDuration || 30; // Default to 30 mins if undefined

    let current = new Date(`${date}T${schedule.startTime}`);
    const end = new Date(`${date}T${schedule.endTime}`);

    while (current < end) {
      // Format as HH:MM
      const timeString = current.toTimeString().slice(0, 5);
      slots.push(timeString);
      current.setMinutes(current.getMinutes() + duration);
    }

    res.json({ date, slots });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/doctors/:id
 * Get doctor details by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('hospital_id', 'name city location');

    if (!doctor) {
      return res.status(404).json({ error: 'Not Found', message: 'Doctor not found' });
    }

    res.status(200).json({
      message: 'Doctor details retrieved successfully',
      data: {
        ...doctor.toObject(),
        hospital_name: doctor.hospital_id?.name,
        city: doctor.hospital_id?.city
      }
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

/**
 * POST /api/doctors
 * Create a new doctor (Admin only)
 */
router.post('/', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { name, hospital_id, specialization, license_number, experience_years, qualifications, consultation_fee, availability_status, phone, email } = req.body;

    if (!name || !hospital_id || !specialization) {
      return res.status(400).json({ error: 'Bad Request', message: 'name, hospital_id, and specialization are required' });
    }

    const doctor = await Doctor.create({
      name,
      hospital_id,
      specialization,
      license_number,
      experience_years,
      qualifications,
      consultation_fee,
      availability_status,
      phone,
      email,
      // Default availability
      availability: [],
      slotDuration: 30
    });

    res.status(201).json({ message: 'Doctor registered successfully', doctor });
  } catch (error) {
    console.error('Create doctor error:', error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

/**
 * PUT /api/doctors/:id
 * Update doctor (Admin only)
 */
router.put('/:id', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates._id;

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ error: 'Not Found', message: 'Doctor not found' });
    }

    res.status(200).json({ message: 'Doctor updated successfully', doctor });
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

module.exports = router;

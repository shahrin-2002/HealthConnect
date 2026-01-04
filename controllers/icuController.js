/**
 * ICU Controller
 * Handles ICU booking, waitlist, and availability management
 */

const ICU = require('../models/ICU');
const ICUBooking = require('../models/ICUBooking');
const ICUWaitlist = require('../models/ICUWaitlist');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const sendEmail = require('../utils/emailService');

// Dhaka sub-locations
const DHAKA_LOCATIONS = [
  'Mohammadpur',
  'Dhanmondi',
  'Gulshan',
  'Badda',
  'Mirpur',
  'Uttara',
  'Banani',
  'Motijheel',
  'Tejgaon',
  'Farmgate',
  'Shahbag',
  'Ramna',
  'Khilgaon',
  'Rampura',
  'Bashundhara'
];

/**
 * Get all locations (Dhaka sub-areas)
 */
const getLocations = async (req, res) => {
  try {
    // Get locations that actually have hospitals with ICU
    const hospitalsWithICU = await ICU.find().populate('hospital_id', 'location');
    const activeLocations = [...new Set(hospitalsWithICU.map(icu => icu.hospital_id?.location).filter(Boolean))];

    res.json({
      message: 'Locations retrieved successfully',
      locations: activeLocations.length > 0 ? activeLocations : DHAKA_LOCATIONS
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
};

/**
 * Get all hospitals with ICU information
 * Supports filtering by location and hospital name
 */
const getHospitalsWithICU = async (req, res) => {
  try {
    const { location, hospital, search } = req.query;

    // Build hospital filter
    let hospitalFilter = {};

    if (location) {
      hospitalFilter.location = { $regex: location, $options: 'i' };
    }

    if (hospital) {
      hospitalFilter.name = { $regex: hospital, $options: 'i' };
    }

    if (search) {
      hospitalFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Get all ICU records with hospital info
    const icuRecords = await ICU.find()
      .populate({
        path: 'hospital_id',
        match: hospitalFilter,
        select: 'name location city phone email description'
      })
      .sort({ 'hospital_id.location': 1 });

    // Filter out null hospital_id (those that didn't match the filter)
    const filteredRecords = icuRecords.filter(record => record.hospital_id !== null);

    // Group by location
    const groupedByLocation = {};
    filteredRecords.forEach(record => {
      const loc = record.hospital_id.location;
      if (!groupedByLocation[loc]) {
        groupedByLocation[loc] = [];
      }
      groupedByLocation[loc].push({
        icu_id: record._id,
        hospital_id: record.hospital_id._id,
        hospital_name: record.hospital_id.name,
        location: record.hospital_id.location,
        city: record.hospital_id.city,
        phone: record.hospital_id.phone,
        email: record.hospital_id.email,
        description: record.hospital_id.description,
        total_icu: record.total_icu,
        available_icu: record.available_icu,
        booked_icu: record.booked_icu,
        price_per_day: record.price_per_day
      });
    });

    res.json({
      message: 'Hospitals with ICU retrieved successfully',
      total: filteredRecords.length,
      data: groupedByLocation
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
};

/**
 * Get ICU details for a specific hospital
 */
const getICUByHospital = async (req, res) => {
  try {
    const { hospitalId } = req.params;

    const icu = await ICU.findOne({ hospital_id: hospitalId })
      .populate('hospital_id', 'name location city phone email description');

    if (!icu) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'ICU information not found for this hospital'
      });
    }

    res.json({
      message: 'ICU details retrieved successfully',
      data: {
        icu_id: icu._id,
        hospital_id: icu.hospital_id._id,
        hospital_name: icu.hospital_id.name,
        location: icu.hospital_id.location,
        city: icu.hospital_id.city,
        phone: icu.hospital_id.phone,
        email: icu.hospital_id.email,
        description: icu.hospital_id.description,
        total_icu: icu.total_icu,
        available_icu: icu.available_icu,
        booked_icu: icu.booked_icu,
        price_per_day: icu.price_per_day
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
};

/**
 * Book an ICU
 */
const bookICU = async (req, res) => {
  try {
    const { hospital_id, check_in_date, patient_name, patient_phone, notes } = req.body;
    const patient_id = req.user.id;

    // Validate required fields
    if (!hospital_id || !check_in_date || !patient_name || !patient_phone) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'hospital_id, check_in_date, patient_name, and patient_phone are required'
      });
    }

    // Find ICU for the hospital
    const icu = await ICU.findOne({ hospital_id });

    if (!icu) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'ICU information not found for this hospital'
      });
    }

    // Check availability
    if (icu.available_icu <= 0) {
      return res.status(400).json({
        error: 'Not Available',
        message: 'No ICU beds available at this hospital. Please join the waitlist.'
      });
    }

    // Create booking
    const booking = new ICUBooking({
      icu_id: icu._id,
      hospital_id,
      patient_id,
      patient_name,
      patient_phone,
      booking_date: new Date(),
      check_in_date: new Date(check_in_date),
      notes: notes || '',
      status: 'booked'
    });

    await booking.save();

    // Update ICU availability
    icu.available_icu -= 1;
    icu.booked_icu += 1;
    await icu.save();

    // Populate hospital info for response
    await booking.populate('hospital_id', 'name location');

    // Get user email for confirmation
    const user = await User.findById(patient_id).select('email');

    // Send confirmation email (async, don't wait)
    if (user?.email) {
      sendBookingConfirmationEmail(user.email, {
        booking_id: booking._id,
        hospital_name: booking.hospital_id.name,
        location: booking.hospital_id.location,
        check_in_date: booking.check_in_date,
        price_per_day: icu.price_per_day,
        patient_name: patient_name,
        patient_phone: patient_phone
      });
    }

    res.status(201).json({
      message: 'ICU booked successfully. Confirmation email sent.',
      data: {
        booking_id: booking._id,
        hospital_name: booking.hospital_id.name,
        location: booking.hospital_id.location,
        check_in_date: booking.check_in_date,
        status: booking.status,
        price_per_day: icu.price_per_day
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
};

/**
 * Join ICU waitlist
 */
const joinWaitlist = async (req, res) => {
  try {
    const { hospital_id, email, patient_name, phone } = req.body;
    const patient_id = req.user?.id || null;

    // Validate required fields
    if (!hospital_id || !email) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'hospital_id and email are required'
      });
    }

    // Check if hospital exists and has ICU
    const icu = await ICU.findOne({ hospital_id });
    if (!icu) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'ICU information not found for this hospital'
      });
    }

    // Check if already in waitlist
    const existingEntry = await ICUWaitlist.findOne({
      hospital_id,
      email,
      status: 'waiting'
    });

    if (existingEntry) {
      return res.status(400).json({
        error: 'Already in Waitlist',
        message: `You are already in the waitlist at position ${existingEntry.position}`,
        position: existingEntry.position
      });
    }

    // Get next position
    const lastInQueue = await ICUWaitlist.findOne({ hospital_id, status: 'waiting' })
      .sort({ position: -1 });
    const nextPosition = lastInQueue ? lastInQueue.position + 1 : 1;

    // Create waitlist entry
    const waitlistEntry = new ICUWaitlist({
      hospital_id,
      email,
      patient_id,
      patient_name: patient_name || '',
      phone: phone || '',
      position: nextPosition,
      status: 'waiting'
    });

    await waitlistEntry.save();

    // Get hospital name for response
    const hospital = await Hospital.findById(hospital_id).select('name location');

    res.status(201).json({
      message: 'Successfully added to waitlist',
      data: {
        waitlist_id: waitlistEntry._id,
        hospital_name: hospital?.name,
        location: hospital?.location,
        position: nextPosition,
        email: email
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
};

/**
 * Get user's ICU bookings
 */
const getMyBookings = async (req, res) => {
  try {
    const patient_id = req.user.id;

    const bookings = await ICUBooking.find({ patient_id })
      .populate('hospital_id', 'name location city phone')
      .populate('icu_id', 'price_per_day')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Bookings retrieved successfully',
      total: bookings.length,
      data: bookings.map(booking => ({
        booking_id: booking._id,
        hospital_name: booking.hospital_id?.name,
        location: booking.hospital_id?.location,
        phone: booking.hospital_id?.phone,
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        status: booking.status,
        price_per_day: booking.icu_id?.price_per_day,
        patient_name: booking.patient_name,
        patient_phone: booking.patient_phone,
        notes: booking.notes,
        booked_at: booking.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
};

/**
 * Cancel ICU booking
 */
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const patient_id = req.user.id;

    const booking = await ICUBooking.findOne({ _id: bookingId, patient_id });

    if (!booking) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found or you are not authorized to cancel it'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        error: 'Already Cancelled',
        message: 'This booking has already been cancelled'
      });
    }

    if (booking.status === 'checked_in') {
      return res.status(400).json({
        error: 'Cannot Cancel',
        message: 'Cannot cancel a booking that has already checked in'
      });
    }

    // Update booking status
    booking.status = 'cancelled';
    await booking.save();

    // Update ICU availability
    const icu = await ICU.findById(booking.icu_id);
    if (icu) {
      icu.available_icu += 1;
      icu.booked_icu -= 1;
      await icu.save();

      // Notify first person in waitlist
      await notifyNextInWaitlist(booking.hospital_id);
    }

    res.json({
      message: 'Booking cancelled successfully',
      data: {
        booking_id: booking._id,
        status: booking.status
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
};

/**
 * Helper function to send booking confirmation email
 */
const sendBookingConfirmationEmail = async (userEmail, bookingDetails) => {
  try {
    const checkInDate = new Date(bookingDetails.check_in_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const plainText = `
ICU Booking Confirmed - HealthConnect

Dear ${bookingDetails.patient_name},

Your ICU bed booking has been successfully confirmed.

Booking Details:
- Booking ID: ${bookingDetails.booking_id}
- Hospital: ${bookingDetails.hospital_name}
- Location: ${bookingDetails.location}
- Check-in Date: ${checkInDate}
- Price per Day: ${bookingDetails.price_per_day} BDT
- Contact Phone: ${bookingDetails.patient_phone}

Please arrive at the hospital on your scheduled check-in date. Bring this email and a valid ID for verification.

Best regards,
HealthConnect Team
    `;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #A8D5BA; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #2B2B2B; margin: 0;">HealthConnect</h1>
        </div>

        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2e7d32; margin-top: 0;">Booking Confirmed!</h2>

          <p style="color: #333; font-size: 16px;">
            Dear <strong>${bookingDetails.patient_name}</strong>,
          </p>

          <p style="color: #333; font-size: 16px;">
            Your ICU bed booking has been successfully confirmed. Here are your booking details:
          </p>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #A8D5BA;">
            <p style="margin: 8px 0;"><strong>Booking ID:</strong> ${bookingDetails.booking_id}</p>
            <p style="margin: 8px 0;"><strong>Hospital:</strong> ${bookingDetails.hospital_name}</p>
            <p style="margin: 8px 0;"><strong>Location:</strong> ${bookingDetails.location}</p>
            <p style="margin: 8px 0;"><strong>Check-in Date:</strong> ${checkInDate}</p>
            <p style="margin: 8px 0;"><strong>Price per Day:</strong> ৳${bookingDetails.price_per_day}</p>
            <p style="margin: 8px 0;"><strong>Contact Phone:</strong> ${bookingDetails.patient_phone}</p>
          </div>

          <p style="color: #666; font-size: 14px;">
            Please arrive at the hospital on your scheduled check-in date. Bring this email and a valid ID for verification.
          </p>

          <p style="color: #666; font-size: 14px;">
            If you need to cancel or modify your booking, please log in to your HealthConnect account or contact the hospital directly.
          </p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">

          <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated message from HealthConnect. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    await sendEmail(userEmail, 'ICU Booking Confirmed - HealthConnect', plainText, htmlContent);
    console.log(`Booking confirmation email sent to ${userEmail}`);
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error.message);
  }
};

/**
 * Helper function to notify next person in waitlist
 */
const notifyNextInWaitlist = async (hospital_id) => {
  try {
    // Find first person in waitlist
    const nextInLine = await ICUWaitlist.findOne({
      hospital_id,
      status: 'waiting'
    }).sort({ position: 1 });

    if (!nextInLine) {
      return; // No one in waitlist
    }

    // Update waitlist status
    nextInLine.status = 'notified';
    nextInLine.notified_at = new Date();
    await nextInLine.save();

    // Get hospital info
    const hospital = await Hospital.findById(hospital_id).select('name location');

    // Send email notification
    try {
      const plainText = `
Good News! ICU Now Available

An ICU bed is now available at ${hospital?.name} (${hospital?.location}).

Please log in to HealthConnect to book your ICU bed as soon as possible.

Note: This availability is on a first-come, first-served basis.

Best regards,
HealthConnect Team
      `;

      const htmlContent = `
        <h2>Good News!</h2>
        <p>An ICU bed is now available at <strong>${hospital?.name}</strong> (${hospital?.location}).</p>
        <p>Please log in to HealthConnect to book your ICU bed as soon as possible.</p>
        <p>Note: This availability is on a first-come, first-served basis.</p>
        <br>
        <p>Best regards,</p>
        <p>HealthConnect Team</p>
      `;

      await sendEmail(nextInLine.email, 'ICU Now Available - HealthConnect', plainText, htmlContent);
    } catch (emailError) {
      console.error('Email notification failed:', emailError.message);
    }

    console.log(`Notified ${nextInLine.email} about ICU availability at ${hospital?.name}`);
  } catch (error) {
    console.error('Error notifying waitlist:', error.message);
  }
};

/**
 * Get user's waitlist entries
 */
const getMyWaitlist = async (req, res) => {
  try {
    const patient_id = req.user.id;
    const userEmail = req.user.email;

    const waitlistEntries = await ICUWaitlist.find({
      $or: [{ patient_id }, { email: userEmail }],
      status: { $in: ['waiting', 'notified'] }
    })
      .populate('hospital_id', 'name location city')
      .sort({ position: 1 });

    res.json({
      message: 'Waitlist entries retrieved successfully',
      total: waitlistEntries.length,
      data: waitlistEntries.map(entry => ({
        waitlist_id: entry._id,
        hospital_name: entry.hospital_id?.name,
        location: entry.hospital_id?.location,
        position: entry.position,
        status: entry.status,
        requested_at: entry.createdAt,
        notified_at: entry.notified_at
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message
    });
  }
};

module.exports = {
  getLocations,
  getHospitalsWithICU,
  getICUByHospital,
  bookICU,
  joinWaitlist,
  getMyBookings,
  cancelBooking,
  getMyWaitlist
};

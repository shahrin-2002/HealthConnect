/**
 * GeneralBed Controller
 * Handles General Bed booking, waitlist, and availability management
 */

const GeneralBed = require('../models/GeneralBed');
const GeneralBedBooking = require('../models/GeneralBedBooking');
const GeneralBedWaitlist = require('../models/GeneralBedWaitlist');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const sendEmail = require('../utils/emailService');

// Dhaka sub-locations
const DHAKA_LOCATIONS = [
  'Mohammadpur', 'Dhanmondi', 'Gulshan', 'Badda', 'Mirpur', 'Uttara',
  'Banani', 'Motijheel', 'Tejgaon', 'Farmgate', 'Shahbag', 'Bashundhara'
];

/**
 * Get all locations (Dhaka sub-areas)
 */
const getLocations = async (req, res) => {
  try {
    const bedsWithHospital = await GeneralBed.find().populate('hospital_id', 'location');
    const activeLocations = [...new Set(bedsWithHospital.map(bed => bed.hospital_id?.location).filter(Boolean))];

    res.json({
      message: 'Locations retrieved successfully',
      locations: activeLocations.length > 0 ? activeLocations : DHAKA_LOCATIONS
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
};

/**
 * Get all hospitals with General Bed information
 */
const getHospitalsWithBeds = async (req, res) => {
  try {
    const { location, hospital, search } = req.query;

    let hospitalFilter = {};
    if (location) hospitalFilter.location = { $regex: location, $options: 'i' };
    if (hospital) hospitalFilter.name = { $regex: hospital, $options: 'i' };
    if (search) {
      hospitalFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const bedRecords = await GeneralBed.find()
      .populate({
        path: 'hospital_id',
        match: hospitalFilter,
        select: 'name location city phone email description'
      })
      .sort({ 'hospital_id.location': 1 });

    const filteredRecords = bedRecords.filter(record => record.hospital_id !== null);

    // Group by location
    const groupedByLocation = {};
    filteredRecords.forEach(record => {
      const loc = record.hospital_id.location;
      if (!groupedByLocation[loc]) groupedByLocation[loc] = [];
      groupedByLocation[loc].push({
        bed_id: record._id,
        hospital_id: record.hospital_id._id,
        hospital_name: record.hospital_id.name,
        location: record.hospital_id.location,
        city: record.hospital_id.city,
        phone: record.hospital_id.phone,
        email: record.hospital_id.email,
        description: record.hospital_id.description,
        total_beds: record.total_beds,
        available_beds: record.available_beds,
        booked_beds: record.booked_beds,
        price_per_day: record.price_per_day
      });
    });

    res.json({
      message: 'Hospitals with General Beds retrieved successfully',
      total: filteredRecords.length,
      data: groupedByLocation
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
};

/**
 * Get General Bed details for a specific hospital
 */
const getBedsByHospital = async (req, res) => {
  try {
    const { hospitalId } = req.params;

    const bed = await GeneralBed.findOne({ hospital_id: hospitalId })
      .populate('hospital_id', 'name location city phone email description');

    if (!bed) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'General Bed information not found for this hospital'
      });
    }

    res.json({
      message: 'General Bed details retrieved successfully',
      data: {
        bed_id: bed._id,
        hospital_id: bed.hospital_id._id,
        hospital_name: bed.hospital_id.name,
        location: bed.hospital_id.location,
        city: bed.hospital_id.city,
        phone: bed.hospital_id.phone,
        email: bed.hospital_id.email,
        description: bed.hospital_id.description,
        total_beds: bed.total_beds,
        available_beds: bed.available_beds,
        booked_beds: bed.booked_beds,
        price_per_day: bed.price_per_day
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
};

/**
 * Book a General Bed
 */
const bookBed = async (req, res) => {
  try {
    const { hospital_id, check_in_date, patient_name, patient_phone, notes } = req.body;
    const patient_id = req.user.id;

    if (!hospital_id || !check_in_date || !patient_name || !patient_phone) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'hospital_id, check_in_date, patient_name, and patient_phone are required'
      });
    }

    const bed = await GeneralBed.findOne({ hospital_id });

    if (!bed) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'General Bed information not found for this hospital'
      });
    }

    if (bed.available_beds <= 0) {
      return res.status(400).json({
        error: 'Not Available',
        message: 'No General Beds available at this hospital. Please join the waitlist.'
      });
    }

    const booking = new GeneralBedBooking({
      bed_id: bed._id,
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

    bed.available_beds -= 1;
    bed.booked_beds += 1;
    await bed.save();

    await booking.populate('hospital_id', 'name location');

    const user = await User.findById(patient_id).select('email');

    if (user?.email) {
      sendBookingConfirmationEmail(user.email, {
        booking_id: booking._id,
        hospital_name: booking.hospital_id.name,
        location: booking.hospital_id.location,
        check_in_date: booking.check_in_date,
        price_per_day: bed.price_per_day,
        patient_name,
        patient_phone,
        type: 'General Bed'
      });
    }

    res.status(201).json({
      message: 'General Bed booked successfully. Confirmation email sent.',
      data: {
        booking_id: booking._id,
        hospital_name: booking.hospital_id.name,
        location: booking.hospital_id.location,
        check_in_date: booking.check_in_date,
        status: booking.status,
        price_per_day: bed.price_per_day
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
};

/**
 * Join General Bed waitlist
 */
const joinWaitlist = async (req, res) => {
  try {
    const { hospital_id, email, patient_name, phone } = req.body;
    const patient_id = req.user?.id || null;

    if (!hospital_id || !email) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'hospital_id and email are required'
      });
    }

    const bed = await GeneralBed.findOne({ hospital_id });
    if (!bed) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'General Bed information not found for this hospital'
      });
    }

    const existingEntry = await GeneralBedWaitlist.findOne({
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

    const lastInQueue = await GeneralBedWaitlist.findOne({ hospital_id, status: 'waiting' })
      .sort({ position: -1 });
    const nextPosition = lastInQueue ? lastInQueue.position + 1 : 1;

    const waitlistEntry = new GeneralBedWaitlist({
      hospital_id,
      email,
      patient_id,
      patient_name: patient_name || '',
      phone: phone || '',
      position: nextPosition,
      status: 'waiting'
    });

    await waitlistEntry.save();

    const hospital = await Hospital.findById(hospital_id).select('name location');

    res.status(201).json({
      message: 'Successfully added to waitlist',
      data: {
        waitlist_id: waitlistEntry._id,
        hospital_name: hospital?.name,
        location: hospital?.location,
        position: nextPosition,
        email
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
};

/**
 * Get user's General Bed bookings
 */
const getMyBookings = async (req, res) => {
  try {
    const patient_id = req.user.id;

    const bookings = await GeneralBedBooking.find({ patient_id })
      .populate('hospital_id', 'name location city phone')
      .populate('bed_id', 'price_per_day')
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
        price_per_day: booking.bed_id?.price_per_day,
        patient_name: booking.patient_name,
        patient_phone: booking.patient_phone,
        notes: booking.notes,
        booked_at: booking.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
};

/**
 * Cancel General Bed booking
 */
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const patient_id = req.user.id;

    const booking = await GeneralBedBooking.findOne({ _id: bookingId, patient_id });

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

    booking.status = 'cancelled';
    await booking.save();

    const bed = await GeneralBed.findById(booking.bed_id);
    if (bed) {
      bed.available_beds += 1;
      bed.booked_beds -= 1;
      await bed.save();
      await notifyNextInWaitlist(booking.hospital_id);
    }

    res.json({
      message: 'Booking cancelled successfully',
      data: { booking_id: booking._id, status: booking.status }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
};

/**
 * Helper: Send booking confirmation email
 */
const sendBookingConfirmationEmail = async (userEmail, bookingDetails) => {
  try {
    const checkInDate = new Date(bookingDetails.check_in_date).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const plainText = `
${bookingDetails.type} Booking Confirmed - HealthConnect

Dear ${bookingDetails.patient_name},

Your ${bookingDetails.type} booking has been successfully confirmed.

Booking Details:
- Booking ID: ${bookingDetails.booking_id}
- Hospital: ${bookingDetails.hospital_name}
- Location: ${bookingDetails.location}
- Check-in Date: ${checkInDate}
- Price per Day: ${bookingDetails.price_per_day} BDT
- Contact Phone: ${bookingDetails.patient_phone}

Please arrive at the hospital on your scheduled check-in date.

Best regards,
HealthConnect Team
    `;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #A8D5BA; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #2B2B2B; margin: 0;">HealthConnect</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2e7d32; margin-top: 0;">${bookingDetails.type} Booking Confirmed!</h2>
          <p>Dear <strong>${bookingDetails.patient_name}</strong>,</p>
          <p>Your ${bookingDetails.type} booking has been successfully confirmed.</p>
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #A8D5BA;">
            <p style="margin: 8px 0;"><strong>Booking ID:</strong> ${bookingDetails.booking_id}</p>
            <p style="margin: 8px 0;"><strong>Hospital:</strong> ${bookingDetails.hospital_name}</p>
            <p style="margin: 8px 0;"><strong>Location:</strong> ${bookingDetails.location}</p>
            <p style="margin: 8px 0;"><strong>Check-in Date:</strong> ${checkInDate}</p>
            <p style="margin: 8px 0;"><strong>Price per Day:</strong> ৳${bookingDetails.price_per_day}</p>
          </div>
          <p style="color: #666;">Please arrive at the hospital on your scheduled check-in date.</p>
        </div>
      </div>
    `;

    await sendEmail(userEmail, `${bookingDetails.type} Booking Confirmed - HealthConnect`, plainText, htmlContent);
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error.message);
  }
};

/**
 * Helper: Notify next person in waitlist
 */
const notifyNextInWaitlist = async (hospital_id) => {
  try {
    const nextInLine = await GeneralBedWaitlist.findOne({
      hospital_id,
      status: 'waiting'
    }).sort({ position: 1 });

    if (!nextInLine) return;

    nextInLine.status = 'notified';
    nextInLine.notified_at = new Date();
    await nextInLine.save();

    const hospital = await Hospital.findById(hospital_id).select('name location');

    const plainText = `
Good News! General Bed Now Available

A General Bed is now available at ${hospital?.name} (${hospital?.location}).

Please log in to HealthConnect to book as soon as possible.

Best regards,
HealthConnect Team
    `;

    const htmlContent = `
      <h2>Good News!</h2>
      <p>A General Bed is now available at <strong>${hospital?.name}</strong> (${hospital?.location}).</p>
      <p>Please log in to HealthConnect to book as soon as possible.</p>
    `;

    await sendEmail(nextInLine.email, 'General Bed Now Available - HealthConnect', plainText, htmlContent);
  } catch (error) {
    console.error('Error notifying waitlist:', error.message);
  }
};

module.exports = {
  getLocations,
  getHospitalsWithBeds,
  getBedsByHospital,
  bookBed,
  joinWaitlist,
  getMyBookings,
  cancelBooking
};

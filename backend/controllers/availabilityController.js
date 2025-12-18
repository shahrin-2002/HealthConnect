const Availability = require("../models/Availability");

exports.createAvailability = async (req, res) => {
  const { date, slots } = req.body;

  const availability = await Availability.create({
    doctorId: req.user.id,
    date,
    slots,
  });

  res.json(availability);
};

exports.getDoctorAvailability = async (req, res) => {
  const { doctorId, date } = req.query;

  const availability = await Availability.findOne({ doctorId, date });
  res.json(availability);
};

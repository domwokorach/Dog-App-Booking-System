const { Appointment } = require("../models/Appointment");
const User = require("../models/User");
const Pet = require("../models/Pet");
const {
  sendBookingConfirmationEmail,
  sendGroomerNotificationEmail,
  sendCancellationEmails,
} = require("../services/emailService");

exports.createAppointment = async (req, res) => {
  try {
    // only pet owners can book appts
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Only pet owners can book appointments" });
    }
    const { petId, groomerId, serviceType, startTime } = req.body;
    // set the duration based on service type
    const duration = serviceType === "basic" ? 60 : 120;

    // validate required fields - removed endTime as it leads to serviceType duration not being used
    if (!petId || !groomerId || !serviceType || !startTime) {
      return res.status(400).json({ error: "Missing required appointment information" });
    }

    if (serviceType !== "basic" && serviceType !== "full") {
      return res.status(400).json({ error: "Service type must be either 'basic' or 'full'" });
    }
    // parse date string to Date object
    const appointmentStart = new Date(startTime);
    // validate date
    if (isNaN(appointmentStart.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // calculate endTime based on startTime + duration
    const appointmentEnd = new Date(appointmentStart);
    appointmentEnd.setMinutes(appointmentStart.getMinutes() + duration);

    /*
        Example with 10:30 AM start time for a basic service (60 min)
    const start = new Date("2023-06-15T10:30:00Z");
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + 60);
    console.log(end.toISOString()); // Outputs: 2025-03-10T11:30:00Z
                                  //* notice hour changed from 10 to 11

        Example with 10:30 PM start time for a full service (120 min)
    const start2 = new Date("2023-06-15T22:30:00Z");
    const end2 = new Date(start2);
    end2.setMinutes(start2.getMinutes() + 120);
    console.log(end2.toISOString()); // Outputs: 2023-03-11T00:30:00Z
                                    //* works across day boundaries
    */

    // verify pet exists and belongs to req user
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ error: "Pet not found" });
    }
    if (pet.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "You can only book appointments for your own pets" });
    }

    // verify groomer exists
    const groomer = await User.findOne({ _id: groomerId, role: "groomer" });
    if (!groomer) {
      return res.status(404).json({ error: "Groomer not found" });
    }

    // check if appt is in the past
    const currentTime = new Date();
    if (appointmentStart < currentTime) {
      return res.status(400).json({ error: "Cannot book appointments in the past" });
    }

    // verify start time is before end time
    if (appointmentStart >= appointmentEnd) {
      return res.status(400).json({ error: "Start time must be before end time" });
    }

    // check for time conflicts
    const hasConflict = await Appointment.checkForConflicts(
      groomerId,
      appointmentStart,
      appointmentEnd
    );

    if (hasConflict) {
      return res.status(409).json({
        error: "This time slot is no longer available. Please choose another time.",
      });
    }

    // create appt
    const newAppointment = new Appointment({
      petId,
      ownerId: req.user.id,
      groomerId,
      serviceType,
      duration,
      startTime: appointmentStart,
      endTime: appointmentEnd,
      status: "confirmed",
      // workflow fields with defaults
      groomerAcknowledged: false,
      appointmentSource: "owner_booking",
      pricingStatus: "pending",
      totalCost: null,
      paymentStatus: "pending",
      reminderSent: false,
      confirmationSent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newAppointment.save();

    // populate the appt with pet, owner, and groomer details for the email
    const populatedAppointment = await Appointment.findById(newAppointment._id)
      .populate("petId", "name species breed")
      .populate("ownerId", "name email")
      .populate("groomerId", "name email");

    // send booking confirmation email and groomer notification
    try {
      const appointmentDetails = {
        bookingReference: populatedAppointment._id.toString().slice(-8).toUpperCase(),
        petName: populatedAppointment.petId?.name || "Pet",
        petBreed: populatedAppointment.petId?.breed || "Unknown breed",
        groomerName: populatedAppointment.groomerId?.name || "Groomer",
        ownerName: populatedAppointment.ownerId?.name || "Pet Owner",
        serviceType: populatedAppointment.serviceType,
        startTime: populatedAppointment.startTime,
        endTime: populatedAppointment.endTime,
        duration: populatedAppointment.duration,
      };

      // send confirmation email to pet owner
      await sendBookingConfirmationEmail(
        populatedAppointment.ownerId.email,
        populatedAppointment.ownerId.name,
        appointmentDetails
      );

      console.log("Booking confirmation email sent for appointment:", populatedAppointment._id);

      // send notification email to groomer
      await sendGroomerNotificationEmail(
        populatedAppointment.groomerId.email,
        populatedAppointment.groomerId.name,
        appointmentDetails
      );

      console.log("Groomer notification email sent for appointment:", populatedAppointment._id);
    } catch (emailError) {
      console.error("Failed to send emails:", emailError);
      // appt creation doesnt fail if email fails
      // still created successfully
    }

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment: populatedAppointment,
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ error: "Server error booking appointment" });
  }
};

// get all appts for current user (owner or groomer)
exports.getUserAppointments = async (req, res) => {
  try {
    console.log("Getting appointments for user:", req.user.id, "Role:", req.user.role);

    const userId = req.user.id;
    const { status } = req.query;

    let query = {};

    // filter by role
    if (req.user.role === "owner") {
      query.ownerId = userId;
    } else if (req.user.role === "groomer") {
      query.groomerId = userId;
    }

    // filter by status if provided
    if (
      status &&
      ["confirmed", "in_progress", "completed", "cancelled", "no_show"].includes(status)
    ) {
      query.status = status;
    }

    console.log("Query:", query);

    // get appts with populated pet and groomer/owner details
    const appointments = await Appointment.find(query)
      .populate("petId", "name species breed age notes")
      .populate("ownerId", "name email phone")
      .populate("groomerId", "name email")
      .lean(); // add lean() for better perf

    console.log("Found appointments:", appointments.length);

    // automatically update status of appointments that have ended
    const currentTime = new Date();
    const updatedAppointments = [];

    for (const appointment of appointments) {
      if (
        (appointment.status === "confirmed" || appointment.status === "in_progress") &&
        new Date(appointment.endTime) < currentTime
      ) {
        // update db
        const updateData = {
          status: "completed",
          updatedAt: currentTime,
        };

        // set actual end time if it was in progress
        if (appointment.status === "in_progress" && !appointment.actualEndTime) {
          updateData.actualEndTime = currentTime;
          if (appointment.actualStartTime) {
            updateData.actualDuration = Math.round(
              (currentTime - new Date(appointment.actualStartTime)) / (1000 * 60)
            );
          }
        }

        await Appointment.findByIdAndUpdate(appointment._id, updateData);

        // update local object
        appointment.status = "completed";
        appointment.updatedAt = currentTime;
        updatedAppointments.push(appointment._id);
      }
    }

    if (updatedAppointments.length > 0) {
      console.log(`Automatically marked ${updatedAppointments.length} appointments as completed`);
    }

    // sort appointments by start time (newest first)
    appointments.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Detailed error fetching appointments:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Server error fetching appointments",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// get specific appt by id
exports.getAppointmentById = async (req, res) => {
  try {
    const appointmentId = req.params.id;

    const appointment = await Appointment.findById(appointmentId)
      .populate("petId", "name species breed age notes")
      .populate("ownerId", "name email phone")
      .populate("groomerId", "name email");

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // check if appt shld be marked as completed
    const currentTime = new Date();
    if (
      (appointment.status === "confirmed" || appointment.status === "in_progress") &&
      new Date(appointment.endTime) < currentTime
    ) {
      appointment.status = "completed";

      // set actual end time if it was in progress
      if (appointment.status === "in_progress" && !appointment.actualEndTime) {
        appointment.actualEndTime = currentTime;
        if (appointment.actualStartTime) {
          appointment.actualDuration = Math.round(
            (currentTime - new Date(appointment.actualStartTime)) / (1000 * 60)
          );
        }
      }

      appointment.updatedAt = currentTime;
      await appointment.save();
      console.log(`Automatically marked appointment ${appointment._id} as completed`);
    }

    // checks if user authorized to view appt
    if (
      (req.user.role === "owner" && appointment.ownerId._id.toString() !== req.user.id) ||
      (req.user.role === "groomer" && appointment.groomerId._id.toString() !== req.user.id)
    ) {
      return res.status(403).json({ error: "Not authorized to view this appointment" });
    }
    res.status(200).json(appointment);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    res.status(500).json({ error: "Server error fetching appointment details" });
  }
};

// reschedule appt (owners only)
exports.updateAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { petId, groomerId, serviceType, startTime } = req.body;

    // validate required fields
    if (!petId || !groomerId || !serviceType || !startTime) {
      return res.status(400).json({ error: "Missing required appointment information" });
    }

    // find the appt
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    // check if user is owner of this appt
    if (appointment.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to update this appointment" });
    }
    // check if appt can be modified
    if (!appointment.canModify()) {
      return res.status(400).json({
        error: "Cannot modify appointments less than 24 hours before start time",
      });
    }
    // set duration based on svc type
    const duration = serviceType === "basic" ? 60 : 120;
    // parse date string to Date object
    const appointmentStart = new Date(startTime);

    // check if appointment is in the past
    const currentTime = new Date();
    if (appointmentStart < currentTime) {
      return res.status(400).json({ error: "Cannot reschedule to a time in the past" });
    }

    // calculate endTime based on startTime + duration
    const appointmentEnd = new Date(appointmentStart);
    appointmentEnd.setMinutes(appointmentStart.getMinutes() + duration);
    // check for conflicts with other appts
    const hasConflict = await Appointment.checkForConflicts(
      groomerId,
      appointmentStart,
      appointmentEnd,
      appointmentId // exclude this appt from conflict check
    );

    if (hasConflict) {
      return res.status(409).json({
        error: "This time slot is no longer available. Please choose another time.",
      });
    }

    // update the appt
    appointment.petId = petId;
    appointment.groomerId = groomerId;
    appointment.serviceType = serviceType;
    appointment.duration = duration;
    appointment.startTime = appointmentStart;
    appointment.endTime = appointmentEnd;
    appointment.updatedAt = new Date();
    // reset status to confirmed if it was previously completed
    appointment.status = "confirmed";

    await appointment.save();

    // populate the appointment with pet, owner, and groomer details for the email
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("petId", "name species breed")
      .populate("ownerId", "name email")
      .populate("groomerId", "name email");

    // send rescheduled appointment confirmation email and groomer notification
    try {
      const appointmentDetails = {
        bookingReference: populatedAppointment._id.toString().slice(-8).toUpperCase(),
        petName: populatedAppointment.petId?.name || "Pet",
        petBreed: populatedAppointment.petId?.breed || "Unknown breed",
        groomerName: populatedAppointment.groomerId?.name || "Groomer",
        ownerName: populatedAppointment.ownerId?.name || "Pet Owner",
        serviceType: populatedAppointment.serviceType,
        startTime: populatedAppointment.startTime,
        endTime: populatedAppointment.endTime,
        duration: populatedAppointment.duration,
      };

      // send confirmation email to pet owner
      await sendBookingConfirmationEmail(
        populatedAppointment.ownerId.email,
        populatedAppointment.ownerId.name,
        appointmentDetails,
        true // isRescheduled = true
      );

      console.log(
        "Rescheduled appointment confirmation email sent for appointment:",
        populatedAppointment._id
      );

      // Send notification email to groomer about rescheduled appointment
      await sendGroomerNotificationEmail(
        populatedAppointment.groomerId.email,
        populatedAppointment.groomerId.name,
        appointmentDetails
      );

      console.log(
        "Groomer notification email sent for rescheduled appointment:",
        populatedAppointment._id
      );
    } catch (emailError) {
      console.error("Failed to send rescheduled appointment emails:", emailError);
      // Don't fail the appointment update if email fails
    }

    res.status(200).json({
      message: "Appointment updated successfully",
      appointment: populatedAppointment,
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({ error: "Server error updating appointment" });
  }
};

// delete an appt (owners only)
exports.deleteAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;

    const appointment = await Appointment.findById(appointmentId)
      .populate("petId", "name species breed")
      .populate("ownerId", "name email")
      .populate("groomerId", "name email");

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // check user is owner of appt
    if (appointment.ownerId._id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this appointment" });
    }

    // check if appt can be modified
    if (!appointment.canModify()) {
      return res.status(400).json({
        error: "Cannot delete appointments less than 24 hours before start time",
      });
    }

    // prepare appt details for email
    const appointmentDetails = {
      bookingReference: appointment._id.toString().slice(-8).toUpperCase(),
      petName: appointment.petId?.name || "Pet",
      petBreed: appointment.petId?.breed || "Unknown breed",
      serviceType: appointment.serviceType,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      duration: appointment.duration,
    };

    // send cancellation emails
    try {
      await sendCancellationEmails(
        appointment.ownerId.email,
        appointment.ownerId.name,
        appointment.groomerId.email,
        appointment.groomerId.name,
        appointmentDetails
      );
      console.log("Cancellation emails sent for appointment:", appointment._id);
    } catch (emailError) {
      console.error("Failed to send cancellation emails:", emailError);
    }

    // delete appt
    await Appointment.deleteOne({ _id: appointmentId });

    res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({ error: "Server error deleting appointment" });
  }
};

// Workflow Actions for Groomers

// acknowledge appointment (groomers only)
exports.acknowledgeAppointment = async (req, res) => {
  try {
    // only groomers can acknowledge appointments
    if (req.user.role !== "groomer") {
      return res.status(403).json({ error: "Only groomers can acknowledge appointments" });
    }

    const appointmentId = req.params.id;
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // check if groomer is assigned to this appointment
    if (appointment.groomerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to acknowledge this appointment" });
    }

    // update groomer acknowledged flag
    appointment.groomerAcknowledged = true;
    appointment.updatedAt = new Date();
    await appointment.save();

    // populate appointment for response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("petId", "name species breed")
      .populate("ownerId", "name email")
      .populate("groomerId", "name email");

    res.status(200).json({
      message: "Appointment acknowledged successfully",
      appointment: populatedAppointment,
    });
  } catch (error) {
    console.error("Error acknowledging appointment:", error);
    res.status(500).json({ error: "Server error acknowledging appointment" });
  }
};

// set pricing for appointment (groomers only)
exports.setPricing = async (req, res) => {
  try {
    // only groomers can set pricing
    if (req.user.role !== "groomer") {
      return res.status(403).json({ error: "Only groomers can set pricing" });
    }

    const appointmentId = req.params.id;
    const { totalCost, pricingStatus = "estimated", reason } = req.body;

    if (!totalCost || totalCost <= 0) {
      return res.status(400).json({ error: "Valid total cost is required" });
    }

    if (!reason) {
      return res.status(400).json({ error: "Reason for pricing is required" });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // check if groomer is assigned to this appointment
    if (appointment.groomerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to set pricing for this appointment" });
    }

    // add to price history
    appointment.priceHistory.push({
      amount: totalCost,
      setAt: new Date(),
      reason: reason,
      setBy: req.user.id,
    });

    // update current pricing
    appointment.totalCost = totalCost;
    appointment.pricingStatus = pricingStatus;
    appointment.updatedAt = new Date();
    await appointment.save();

    // populate appointment for response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("petId", "name species breed")
      .populate("ownerId", "name email")
      .populate("groomerId", "name email")
      .populate("priceHistory.setBy", "name");

    res.status(200).json({
      message: "Pricing set successfully",
      appointment: populatedAppointment,
    });
  } catch (error) {
    console.error("Error setting pricing:", error);
    res.status(500).json({ error: "Server error setting pricing" });
  }
};

// start service (groomers only)
exports.startService = async (req, res) => {
  try {
    // only groomers can start service
    if (req.user.role !== "groomer") {
      return res.status(403).json({ error: "Only groomers can start service" });
    }

    const appointmentId = req.params.id;
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // check if groomer is assigned to this appointment
    if (appointment.groomerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to start this service" });
    }

    // check if appointment is in correct status
    if (appointment.status !== "confirmed") {
      return res.status(400).json({ error: "Can only start confirmed appointments" });
    }

    // check if appointment has been acknowledged
    if (!appointment.groomerAcknowledged) {
      return res
        .status(400)
        .json({ error: "Appointment must be acknowledged before starting service" });
    }

    // update status and set actual start time
    appointment.status = "in_progress";
    appointment.actualStartTime = new Date();
    appointment.updatedAt = new Date();
    await appointment.save();

    // populate appointment for response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("petId", "name species breed age notes")
      .populate("ownerId", "name email phone")
      .populate("groomerId", "name email");

    res.status(200).json({
      message: "Service started successfully",
      appointment: populatedAppointment,
    });
  } catch (error) {
    console.error("Error starting service:", error);
    res.status(500).json({ error: "Server error starting service" });
  }
};

// complete service (groomers only)
exports.completeService = async (req, res) => {
  try {
    // only groomers can complete service
    if (req.user.role !== "groomer") {
      return res.status(403).json({ error: "Only groomers can complete service" });
    }

    const appointmentId = req.params.id;
    const { groomerNotes, photos } = req.body;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // check if groomer is assigned to this appointment
    if (appointment.groomerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to complete this service" });
    }

    // check if appointment is in correct status
    if (appointment.status !== "in_progress") {
      return res.status(400).json({ error: "Can only complete appointments that are in progress" });
    }

    // update status and set completion details
    appointment.status = "completed";
    appointment.actualEndTime = new Date();

    // calculate actual duration if we have actual start time
    if (appointment.actualStartTime) {
      appointment.actualDuration = Math.round(
        (appointment.actualEndTime - appointment.actualStartTime) / (1000 * 60)
      );
    }

    // add groomer notes if provided
    if (groomerNotes) {
      appointment.groomerNotes = groomerNotes;
    }

    // add photos if provided
    if (photos && Array.isArray(photos)) {
      appointment.photos = photos.map((photo) => ({
        url: photo.url,
        uploadedAt: new Date(),
        description: photo.description || "",
      }));
    }

    appointment.updatedAt = new Date();
    await appointment.save();

    // populate appointment for response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("petId", "name species breed age notes")
      .populate("ownerId", "name email phone")
      .populate("groomerId", "name email");

    res.status(200).json({
      message: "Service completed successfully",
      appointment: populatedAppointment,
    });
  } catch (error) {
    console.error("Error completing service:", error);
    res.status(500).json({ error: "Server error completing service" });
  }
};

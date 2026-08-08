const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AppointmentSchema = new Schema({
  petId: { type: Schema.Types.ObjectId, ref: "Pet", required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  groomerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  serviceType: { type: String, enum: ["basic", "full"], required: true },
  duration: { type: Number, enum: [60, 120], required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true }, // ISO 8601 format (e.g., 2025-03-15T14:30:00Z)
  status: {
    type: String,
    enum: ["confirmed", "in_progress", "completed", "cancelled", "no_show"],
    default: "confirmed",
  },

  // groomer workflow fields
  groomerAcknowledged: { type: Boolean, default: false },
  appointmentSource: {
    type: String,
    enum: ["owner_booking", "groomer_created", "phone_booking"],
    default: "owner_booking",
  },

  // pricing fields
  pricingStatus: {
    type: String,
    enum: ["pending", "estimated", "confirmed"],
    default: "pending",
  },
  totalCost: { type: Number, default: null },
  priceHistory: [
    {
      amount: { type: Number, required: true },
      setAt: { type: Date, default: Date.now },
      reason: { type: String, required: true },
      setBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
  ],

  // service tracking
  actualStartTime: { type: Date },
  actualEndTime: { type: Date },
  actualDuration: { type: Number },

  // additional fields
  specialInstructions: { type: String },
  groomerNotes: { type: String },
  photos: [
    {
      url: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
      description: { type: String },
    },
  ],

  // cancellation tracking
  cancellationReason: { type: String },
  cancellationFee: { type: Number },
  noShowFee: { type: Number },

  // payment tracking
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "refunded"],
    default: "pending",
  },

  // communication tracking
  reminderSent: { type: Boolean, default: false },
  confirmationSent: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// biz hours config
const BUSINESS_HOURS = {
  0: { start: 10, end: 19 }, // Sunday: 10am-7pm SGT
  1: { start: 11, end: 20 }, // Monday: 11am-8pm SGT
  2: { start: 11, end: 20 }, // Tuesday: 11am-8pm SGT
  3: null, // Wednesday: Closed
  4: { start: 11, end: 20 }, // Thursday: 11am-8pm SGT
  5: { start: 11, end: 20 }, // Friday: 11am-8pm SGT
  6: { start: 10, end: 19 }, // Saturday: 10am-7pm SGT
};

// helper function to check if a day is a business day
AppointmentSchema.statics.isBusinessDay = function (date) {
  const dayOfWeek = new Date(date).getDay();
  return BUSINESS_HOURS[dayOfWeek] !== null;
};

// helper function to get business hours for a specific day
AppointmentSchema.statics.getBusinessHours = function (date) {
  const dayOfWeek = new Date(date).getDay();
  return BUSINESS_HOURS[dayOfWeek];
};

// instance methods are useful when working with individual appointment instances
// ie. one specific appt at a time
// check if the appointment can be modified (>24h before start)
AppointmentSchema.methods.canModify = function () {
  const currentTime = new Date();
  const appointmentTime = new Date(this.startTime);
  // calculate difference in hours
  const hoursDifference = (appointmentTime - currentTime) / (1000 * 60 * 60);
  return hoursDifference > 24; // returns true if more than 24 hrs before start
};

// instance method to check if appointment should be marked as completed
AppointmentSchema.methods.shouldBeCompleted = function () {
  const currentTime = new Date();
  const appointmentEndTime = new Date(this.endTime);
  // checks if current time is after appointment end time and if status is confirmed
  return currentTime > appointmentEndTime && this.status === "confirmed";
};

// custom helper method to update status of confirmed appointments that have ended
AppointmentSchema.statics.updateCompletedAppointments = async function (appointments) {
  const currentTime = new Date();
  const updatedAppointments = [];

  for (const appointment of appointments) {
    if (
      (appointment.status === "confirmed" || appointment.status === "in_progress") &&
      new Date(appointment.endTime) < currentTime
    ) {
      appointment.status = "completed";
      appointment.updatedAt = currentTime;
      // set actual end time if it was in progress
      if (appointment.status === "in_progress" && !appointment.actualEndTime) {
        appointment.actualEndTime = currentTime;
        appointment.actualDuration = Math.round(
          (currentTime - new Date(appointment.actualStartTime || appointment.startTime)) /
            (1000 * 60)
        );
      }
      await appointment.save();
      updatedAppointments.push(appointment._id);
    }
  }

  return updatedAppointments;
};

// custom method to check for time conflicts, super impt job of checking whether potential appt overlaps with existing one
AppointmentSchema.statics.checkForConflicts = async function (
  groomerId,
  startTime,
  endTime,
  excludeAppointmentId = null // optional param to exclude current appt from check, used when updating existing appt
) {
  const query = {
    groomerId,
    status: { $in: ["confirmed", "in_progress"] }, // include both confirmed and in_progress appointments
    $or: [
      // newStartTime < existingEndTime && newEndTime > existingStartTime
      // true and true overlaps
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
    ],
  };
  // finds existing appointments that overlap with proposed time slot
  // find appointments where
  // the existing appointment's start time is before (lt) the new appointment's end time
  // AND
  // the existing appointment's end time is after (gt) the new appointment's start time

  // this condition captures all possible overlap scenarios
  /* 
  S1: New appt starts during existing appt
  Existing:  |------------| 10:00 - 11:00
  New:              |------------| 10:30 - 11:30
  S2: New appt ends during existing appt
  Existing:          |------------|  10:00 - 11:00
  New:      |------------| 09:30 - 10:30
  S3: New appt completely inside existing appt
  Existing:  |---------------| 09:00 - 11:00
  New:          |-----| 09:30 - 10:30
  S4: New appt completely contains existing appt
  Existing:     |-----| 09:30 - 10:30
  New:      |--------------| 09:00 - 11:00
  */

  // exclude the current appointment if updating
  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }
  // executes query to get all appts that satisfy the conditions
  const conflictingAppointments = await this.find(query);
  // returns true if there are any conflicting appointments
  return conflictingAppointments.length > 0;
};

// middleware (pre-save validation)
// ensure startTime always before endTime
AppointmentSchema.pre("save", function (next) {
  if (this.startTime >= this.endTime) {
    const err = new Error("Start time must be before end time");
    return next(err);
  }

  // check if appointment is during business hours
  const appointmentDate = new Date(this.startTime);
  if (!this.constructor.isBusinessDay(appointmentDate)) {
    const err = new Error("Appointments cannot be scheduled on days when we are closed");
    return next(err);
  }

  const businessHours = this.constructor.getBusinessHours(appointmentDate);
  //? Timezone conversion
  //? Convert UTC to SGT: Add 8 hours
  //? Extract UTC hours from the converted times to represent SG hours consistently
  //? Same behaviour in development and production and should work for any server timezone
  // convert UTC times to Singapore time (UTC+8) for business hours validation
  const startTimeInSGT = new Date(this.startTime.getTime() + 8 * 60 * 60 * 1000);
  const endTimeInSGT = new Date(this.endTime.getTime() + 8 * 60 * 60 * 1000);

  // use UTC hours/minutes on the converted times to avoid server timezone issues
  const startHour = startTimeInSGT.getUTCHours();
  const endHour = endTimeInSGT.getUTCHours();
  const endMinute = endTimeInSGT.getUTCMinutes();

  // debug logging for timezone conversion
  console.log("Business Hours Validation Debug:", {
    originalStartTimeUTC: this.startTime.toISOString(),
    originalEndTimeUTC: this.endTime.toISOString(),
    startTimeInSGT: startTimeInSGT.toISOString(),
    endTimeInSGT: endTimeInSGT.toISOString(),
    startHour,
    endHour,
    endMinute,
    businessHours,
    dayOfWeek: appointmentDate.getDay(),
    serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  if (
    startHour < businessHours.start ||
    endHour > businessHours.end ||
    (endHour === businessHours.end && endMinute > 0)
  ) {
    console.log("Business hours validation FAILED:", {
      startHour,
      businessStart: businessHours.start,
      endHour,
      businessEnd: businessHours.end,
      endMinute,
    });
    const err = new Error("Appointment must be within business hours");
    return next(err);
  }

  this.updatedAt = Date.now();
  next();
});

// added these static methods to simplify availability checks, controller will be a lot cleaner
// get all confirmed appointments for a groomer on a given day
AppointmentSchema.statics.getGroomerConfirmedAppointments = async function (groomerId, date) {
  // convert date to start/end of day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // find all appointments with confirmed status for this groomer on this day
  // sort by startTime
  const appointments = await this.find({
    groomerId,
    status: "confirmed",
    startTime: { $gte: startOfDay, $lte: endOfDay },
  }).sort({ startTime: 1 });

  return appointments;
};

AppointmentSchema.statics.getAvailableTimeSlots = async function (groomerId, date, duration) {
  // check if it's a business day
  if (!this.isBusinessDay(date)) {
    return []; // no slots available on closed days
  }

  // get business hours for this specific day
  const businessHours = this.getBusinessHours(date);
  if (!businessHours) {
    return [];
  }

  // get all confirmed appointments for this day
  const appointments = await this.getGroomerConfirmedAppointments(groomerId, date);

  // get TimeBlock model from the exports
  const TimeBlock = require("./Appointment").TimeBlock;

  // get all time blocks for this day
  const timeBlocks = await TimeBlock.getGroomerTimeBlocks(groomerId, date);

  const dayDate = new Date(date);
  const slots = [];

  // generate time slots based on business hours for this day
  for (let hour = businessHours.start; hour < businessHours.end; hour++) {
    for (let minute = 0; minute < 60; minute += 60) {
      // check if slot (start + duration) fits within business hours in SGT BEFORE creating the slot
      const slotStartSGT = hour + minute / 60; // start time in SGT (as decimal hours)
      const slotEndSGT = slotStartSGT + duration / 60; // end time in SGT (as decimal hours)

      // only create slot if the ENTIRE appointment (start to end) fits within business hours
      if (slotEndSGT <= businessHours.end) {
        // create date in Singapore timezone (UTC+8)
        // convert Singapore time to UTC for storage
        const slotStart = new Date(dayDate);
        slotStart.setUTCHours(hour - 8, minute, 0, 0); // minus 8 hours to convert SGT to UTC

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotStart.getMinutes() + duration);

        slots.push({
          start: slotStart,
          end: slotEnd,
          available: true,
        });
      }
    }
  }

  // mark slots as unavailable if they conflict with existing appointments
  for (const appointment of appointments) {
    const appointmentStart = new Date(appointment.startTime);
    const appointmentEnd = new Date(appointment.endTime);

    for (const slot of slots) {
      if (slot.start < appointmentEnd && slot.end > appointmentStart) {
        slot.available = false;
      }
    }
  }

  // mark slots as unavailable if they conflict with time blocks
  for (const timeBlock of timeBlocks) {
    const blockStart = new Date(timeBlock.startTime);
    const blockEnd = new Date(timeBlock.endTime);

    for (const slot of slots) {
      if (slot.start < blockEnd && slot.end > blockStart) {
        slot.available = false;
      }
    }
  }

  // filter out past time slots for the current day
  const now = new Date();
  const currentTime = now.getTime();

  return slots.filter((slot) => {
    // keep the slot if it's available and not in the past
    return slot.available && slot.start.getTime() > currentTime;
  });
};

module.exports = mongoose.model("Appointment", AppointmentSchema);

// timeblock model for groomer availability management
const TimeBlockSchema = new Schema({
  groomerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  blockType: {
    type: String,
    enum: ["unavailable", "break", "lunch", "personal", "maintenance"],
    default: "unavailable",
  },
  reason: { type: String },
  isRecurring: { type: Boolean, default: false },
  recurringPattern: {
    frequency: { type: String, enum: ["daily", "weekly", "monthly"] },
    daysOfWeek: [{ type: Number, min: 0, max: 6 }], // 0 = Sunday, 6 = Saturday
    endDate: { type: Date },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// validation to ensure startTime is before endTime
TimeBlockSchema.pre("save", function (next) {
  if (this.startTime >= this.endTime) {
    const err = new Error("Start time must be before end time");
    return next(err);
  }
  this.updatedAt = Date.now();
  next();
});

// static method to get all time blocks for a groomer on a specific date
TimeBlockSchema.statics.getGroomerTimeBlocks = async function (groomerId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return await this.find({
    groomerId,
    startTime: { $lt: endOfDay },
    endTime: { $gt: startOfDay },
  }).sort({ startTime: 1 });
};

// static method to check for conflicts with existing time blocks
TimeBlockSchema.statics.checkForTimeBlockConflicts = async function (
  groomerId,
  startTime,
  endTime,
  excludeBlockId = null
) {
  const query = {
    groomerId,
    $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
  };

  if (excludeBlockId) {
    query._id = { $ne: excludeBlockId };
  }

  const conflictingBlocks = await this.find(query);
  return conflictingBlocks.length > 0;
};

const TimeBlock = mongoose.model("TimeBlock", TimeBlockSchema);

module.exports = {
  Appointment: mongoose.model("Appointment", AppointmentSchema),
  TimeBlock: TimeBlock,
};

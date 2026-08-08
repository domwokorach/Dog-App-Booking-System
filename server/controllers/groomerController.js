const User = require("../models/User");
const { Appointment, TimeBlock } = require("../models/Appointment");

exports.getAllGroomers = async (req, res) => {
  try {
    // find all users with role groomer
    const groomers = await User.find({ role: "groomer" }).select("-password");

    res.status(200).json(groomers);
  } catch (error) {
    console.error("Error fetching groomers:", error);
    res.status(500).json({ error: "Server error fetching groomers" });
  }
};

exports.getGroomerById = async (req, res) => {
  try {
    const groomerId = req.params.id;
    const groomer = await User.findOne({
      _id: groomerId,
      role: "groomer",
    }).select("-password");

    if (!groomer) {
      return res.status(404).json({ error: "Groomer not found" });
    }
    res.status(200).json(groomer);
  } catch (error) {
    console.error("Error fetching groomer:", error);
    res.status(500).json({ error: "Server error fetching groomer details" });
  }
};

// get groomer available time slots on specific date
exports.getGroomerAvailability = async (req, res) => {
  try {
    const groomerId = req.params.id || req.params.groomerId;
    const { date, duration } = req.query;

    // query params validation
    if (!date) {
      return res.status(400).json({ error: "Date parameter is required (YYYY-MM-DD)" });
    }

    const appointmentDuration = parseInt(duration) || 60;

    if (appointmentDuration !== 60 && appointmentDuration !== 120) {
      return res.status(400).json({ error: "Duration must be either 60 or 120 minutes" });
    }

    const groomer = await User.findOne({ _id: groomerId, role: "groomer" });
    if (!groomer) {
      return res.status(404).json({ error: "Groomer not found" });
    }

    // parse date and check if valid
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (appointmentDate < today) {
      return res.status(400).json({ error: "Cannot book appointments for past dates" });
    }

    // model static method to get available time slots (this now considers time blocks)
    const availableSlots = await Appointment.getAvailableTimeSlots(
      groomerId,
      appointmentDate,
      appointmentDuration
    );

    res.status(200).json(availableSlots);
  } catch (error) {
    console.error("Error fetching groomer availability:", error);
    res.status(500).json({ error: "Server error fetching groomer availability" });
  }
};

// get groomer schedule for a specific date range (calendar view)
exports.getGroomerSchedule = async (req, res) => {
  try {
    // only groomers can view their own schedule or admins can view any schedule
    if (req.user.role !== "groomer" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const groomerId = req.params.id || req.user.id;

    // if not admin, ensure groomer can only view their own schedule
    if (req.user.role === "groomer" && groomerId !== req.user.id) {
      return res.status(403).json({ error: "You can only view your own schedule" });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Start date and end date are required (YYYY-MM-DD)" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    // set time to cover full days
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // get appts in date range
    const appointments = await Appointment.find({
      groomerId,
      startTime: { $gte: start, $lte: end },
    })
      .populate("petId", "name species breed age notes")
      .populate("ownerId", "name email phone")
      .sort({ startTime: 1 });

    // get time blocks in date range
    const timeBlocks = await TimeBlock.find({
      groomerId,
      startTime: { $lt: end },
      endTime: { $gt: start },
    }).sort({ startTime: 1 });

    res.status(200).json({
      appointments,
      timeBlocks,
      groomerId,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error("Error fetching groomer schedule:", error);
    res.status(500).json({ error: "Server error fetching groomer schedule" });
  }
};

// create time block (groomer blocks off time)
exports.createTimeBlock = async (req, res) => {
  try {
    // only groomers can create time blocks for themselves
    if (req.user.role !== "groomer") {
      return res.status(403).json({ error: "Only groomers can create time blocks" });
    }

    const { startTime, endTime, blockType, reason, isRecurring, recurringPattern } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({ error: "Start time and end time are required" });
    }

    const blockStart = new Date(startTime);
    const blockEnd = new Date(endTime);

    if (isNaN(blockStart.getTime()) || isNaN(blockEnd.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    if (blockStart >= blockEnd) {
      return res.status(400).json({ error: "Start time must be before end time" });
    }

    // check for conflicts with existing appointments
    const appointmentConflicts = await Appointment.checkForConflicts(
      req.user.id,
      blockStart,
      blockEnd
    );

    if (appointmentConflicts) {
      return res.status(409).json({
        error: "Time block conflicts with existing appointments",
      });
    }

    // check for conflicts with existing time blocks
    const timeBlockConflicts = await TimeBlock.checkForTimeBlockConflicts(
      req.user.id,
      blockStart,
      blockEnd
    );

    if (timeBlockConflicts) {
      return res.status(409).json({
        error: "Time block conflicts with existing time blocks",
      });
    }

    // create time block
    const timeBlock = new TimeBlock({
      groomerId: req.user.id,
      startTime: blockStart,
      endTime: blockEnd,
      blockType: blockType || "unavailable",
      reason,
      isRecurring: isRecurring || false,
      recurringPattern: isRecurring ? recurringPattern : undefined,
    });

    await timeBlock.save();

    res.status(201).json({
      message: "Time block created successfully",
      timeBlock,
    });
  } catch (error) {
    console.error("Error creating time block:", error);
    res.status(500).json({ error: "Server error creating time block" });
  }
};

// update time block
exports.updateTimeBlock = async (req, res) => {
  try {
    if (req.user.role !== "groomer") {
      return res.status(403).json({ error: "Only groomers can update time blocks" });
    }

    const timeBlockId = req.params.timeBlockId;
    const { startTime, endTime, blockType, reason, isRecurring, recurringPattern } = req.body;

    const timeBlock = await TimeBlock.findById(timeBlockId);
    if (!timeBlock) {
      return res.status(404).json({ error: "Time block not found" });
    }

    if (timeBlock.groomerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "You can only update your own time blocks" });
    }

    if (startTime && endTime) {
      const blockStart = new Date(startTime);
      const blockEnd = new Date(endTime);

      if (isNaN(blockStart.getTime()) || isNaN(blockEnd.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }

      if (blockStart >= blockEnd) {
        return res.status(400).json({ error: "Start time must be before end time" });
      }

      // check for conflicts (excluding current time block)
      const appointmentConflicts = await Appointment.checkForConflicts(
        req.user.id,
        blockStart,
        blockEnd
      );

      if (appointmentConflicts) {
        return res.status(409).json({
          error: "Updated time block would conflict with existing appointments",
        });
      }

      const timeBlockConflicts = await TimeBlock.checkForTimeBlockConflicts(
        req.user.id,
        blockStart,
        blockEnd,
        timeBlockId
      );

      if (timeBlockConflicts) {
        return res.status(409).json({
          error: "Updated time block would conflict with existing time blocks",
        });
      }

      timeBlock.startTime = blockStart;
      timeBlock.endTime = blockEnd;
    }

    if (blockType) timeBlock.blockType = blockType;
    if (reason !== undefined) timeBlock.reason = reason;
    if (isRecurring !== undefined) timeBlock.isRecurring = isRecurring;
    if (recurringPattern !== undefined) timeBlock.recurringPattern = recurringPattern;

    await timeBlock.save();

    res.status(200).json({
      message: "Time block updated successfully",
      timeBlock,
    });
  } catch (error) {
    console.error("Error updating time block:", error);
    res.status(500).json({ error: "Server error updating time block" });
  }
};

// delete time block
exports.deleteTimeBlock = async (req, res) => {
  try {
    if (req.user.role !== "groomer") {
      return res.status(403).json({ error: "Only groomers can delete time blocks" });
    }

    const timeBlockId = req.params.timeBlockId;
    const timeBlock = await TimeBlock.findById(timeBlockId);

    if (!timeBlock) {
      return res.status(404).json({ error: "Time block not found" });
    }

    if (timeBlock.groomerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "You can only delete your own time blocks" });
    }

    await TimeBlock.deleteOne({ _id: timeBlockId });

    res.status(200).json({ message: "Time block deleted successfully" });
  } catch (error) {
    console.error("Error deleting time block:", error);
    res.status(500).json({ error: "Server error deleting time block" });
  }
};

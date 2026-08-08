const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const groomerController = require("../controllers/groomerController");
const { verifyToken } = require("../utils/jwt");
const { isOwner, isGroomer, isAuthenticated } = require("../middleware/roleMiddleware");

router.use(verifyToken);
// book new appt (owner)
router.post("/", isOwner, appointmentController.createAppointment);
// get all appts for current user
router.get("/", isAuthenticated, appointmentController.getUserAppointments);
// get available slots for groomer (alt route)
router.get(
  "/available-slots/:groomerId",
  isAuthenticated,
  groomerController.getGroomerAvailability
);

// workflow routes for groomers (must come before /:id routes to avoid conflicts)
router.patch("/:id/acknowledge", isGroomer, appointmentController.acknowledgeAppointment);
router.patch("/:id/pricing", isGroomer, appointmentController.setPricing);
router.patch("/:id/start", isGroomer, appointmentController.startService);
router.patch("/:id/complete", isGroomer, appointmentController.completeService);

// get a specific appt by id
router.get("/:id", isAuthenticated, appointmentController.getAppointmentById);
// update appt (owner)
router.put("/:id", isOwner, appointmentController.updateAppointment);
// delete appt (owner)
router.delete("/:id", isOwner, appointmentController.deleteAppointment);

module.exports = router;

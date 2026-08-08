const express = require("express");
const router = express.Router();
const petController = require("../controllers/petController");
const { verifyToken } = require("../utils/jwt");
const { isOwner, isAuthenticated } = require("../middleware/roleMiddleware");

router.use(verifyToken);
// get all pets
router.get("/", isOwner, petController.getUserPets);
// get deleted pets
router.get("/deleted", isOwner, petController.getDeletedPets);
// owners can only view own pets
router.get("/:id", isAuthenticated, petController.getPetById);

router.post("/", isOwner, petController.createPet);

router.put("/:id", isOwner, petController.updatePet);

router.delete("/:id", isOwner, petController.deletePet);

// restore a soft-deleted pet
router.put("/:id/restore", isOwner, petController.restorePet);

// get appointments for a specific pet
router.get("/:id/appointments", isAuthenticated, petController.getPetAppointments);

// // temp migration endpoint
// router.post("/migrate", isOwner, petController.migratePets);

module.exports = router;

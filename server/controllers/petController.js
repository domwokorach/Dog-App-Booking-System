const Pet = require("../models/Pet");
const { Appointment } = require("../models/Appointment");

exports.getUserPets = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const pets = await Pet.find({ ownerId, isDeleted: false });
    res.status(200).json(pets);
  } catch (error) {
    console.error("Error fetching pets:", error);
    res.status(500).json({ error: "Server error fetching pets" });
  }
};

exports.getPetById = async (req, res) => {
  try {
    const petId = req.params.id;
    // find pet regardless of deletion status (for appointment history)
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ error: "Pet not found" });
    }
    // if owner, check if pet belongs to them
    if (req.user.role === "owner" && pet.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to view this pet" });
    }
    res.status(200).json(pet);
  } catch (error) {
    console.error("Error fetching pet:", error);
    res.status(500).json({ error: "Server error fetching pet details" });
  }
};

exports.createPet = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Only pet owners can add pets" });
    }
    const { name, species, breed, age, notes } = req.body;
    if (!name || !species || !breed || !age) {
      return res.status(400).json({ error: "Missing required pet information" });
    }

    // create new pet with owner ID from authenticated user
    const newPet = new Pet({
      name,
      species,
      breed,
      age,
      notes,
      ownerId: req.user.id,
      updatedAt: Date.now(),
    });

    await newPet.save();

    res.status(201).json({
      message: "Pet added successfully",
      pet: newPet,
    });
  } catch (error) {
    console.error("Error creating pet:", error);
    res.status(500).json({ error: "Server error creating pet" });
  }
};

exports.updatePet = async (req, res) => {
  try {
    const petId = req.params.id;
    const { name, species, breed, age, notes } = req.body;

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ error: "Pet not found" });
    }
    if (pet.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to update this pet" });
    }

    if (name) pet.name = name;
    if (species) pet.species = species;
    if (breed) pet.breed = breed;
    if (age) pet.age = age;
    if (notes !== undefined) pet.notes = notes;

    pet.updatedAt = Date.now();

    await pet.save();

    res.status(200).json({
      message: "Pet updated successfully",
      pet,
    });
  } catch (error) {
    console.error("Error updating pet:", error);
    res.status(500).json({ error: "Server error updating pet" });
  }
};

exports.deletePet = async (req, res) => {
  try {
    const petId = req.params.id;

    const pet = await Pet.findById(petId);

    if (!pet) {
      return res.status(404).json({ error: "Pet not found" });
    }

    if (pet.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this pet" });
    }

    // check if pet is already deleted
    if (pet.isDeleted) {
      return res.status(400).json({ error: "Pet is already deleted" });
    }

    // prevent pets with upcoming appointments from being deleted
    const currentDate = new Date();

    const upcomingAppointments = await Appointment.find({
      petId: petId,
      status: "confirmed",
      startTime: { $gte: currentDate },
    });

    if (upcomingAppointments.length > 0) {
      return res.status(400).json({
        error:
          "Cannot delete pets with upcoming appointments. Please cancel all appointments first.",
        appointments: upcomingAppointments,
      });
    }

    // soft delete: mark as deleted instead of removing
    pet.isDeleted = true;
    pet.deletedAt = new Date();
    pet.updatedAt = new Date();
    await pet.save();

    res.status(200).json({
      message: "Pet deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting pet:", error);
    res.status(500).json({ error: "Server error deleting pet" });
  }
};

exports.getPetAppointments = async (req, res) => {
  try {
    const petId = req.params.id;
    const userId = req.user.id;

    // first verify the pet belongs to the user (allow both deleted and non-deleted pets for appointment history)
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ error: "Pet not found" });
    }

    // check if user owns this pet
    if (pet.ownerId.toString() !== userId) {
      return res.status(403).json({ error: "Not authorized to view this pet's appointments" });
    }

    // get appointments for this specific pet (regardless of pet deletion status)
    const appointments = await Appointment.find({ petId })
      .populate("groomerId", "name email")
      .sort({ startTime: -1 }); // sort by date, newest first

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching pet appointments:", error);
    res.status(500).json({ error: "Server error fetching pet appointments" });
  }
};

// get deleted pets (for potential restoration)
exports.getDeletedPets = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const deletedPets = await Pet.find({ ownerId, isDeleted: true }).sort({ deletedAt: -1 });
    res.status(200).json(deletedPets);
  } catch (error) {
    console.error("Error fetching deleted pets:", error);
    res.status(500).json({ error: "Server error fetching deleted pets" });
  }
};

// restore a soft-deleted pet
exports.restorePet = async (req, res) => {
  try {
    const petId = req.params.id;
    const pet = await Pet.findById(petId);

    if (!pet) {
      return res.status(404).json({ error: "Pet not found" });
    }

    if (pet.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to restore this pet" });
    }

    if (!pet.isDeleted) {
      return res.status(400).json({ error: "Pet is not deleted" });
    }

    // restore pet
    pet.isDeleted = false;
    pet.deletedAt = null;
    pet.updatedAt = new Date();
    await pet.save();

    res.status(200).json({
      message: "Pet restored successfully",
      pet,
    });
  } catch (error) {
    console.error("Error restoring pet:", error);
    res.status(500).json({ error: "Server error restoring pet" });
  }
};

// // temporary migration endpoint
// exports.migratePets = async (req, res) => {
//   try {
//     // update all pets that don't have the isDeleted field
//     const result = await Pet.updateMany(
//       { isDeleted: { $exists: false } },
//       {
//         $set: {
//           isDeleted: false,
//           deletedAt: null,
//         },
//       }
//     );
//     res.status(200).json({
//       message: "Migration completed",
//       modifiedCount: result.modifiedCount,
//     });
//   } catch (error) {
//     console.error("Error migrating pets:", error);
//     res.status(500).json({ error: "Migration failed" });
//   }
// };

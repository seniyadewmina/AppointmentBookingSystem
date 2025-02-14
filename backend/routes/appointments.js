const express = require("express");
const { Appointment, Slot } = require("../models");
const auth = require("../middleware/auth"); // Authentication middleware

const router = express.Router();

// Get user's appointments (authenticated)
router.get("/", auth, async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      where: { userId: req.userId },
      include: Slot,
      order: [[Slot, 'date', 'ASC'], [Slot, 'start_time', 'ASC']]
    });
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to retrieve appointments",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Book appointment (authenticated)
router.post("/", auth, async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { slotId, contact, name } = req.body;
    const userId = req.userId;

    // Validate input
    if (!slotId || !contact || !name) {
      await transaction.rollback();
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check slot availability
    const slot = await Slot.findByPk(slotId, { transaction });
    if (!slot || !slot.is_available) {
      await transaction.rollback();
      return res.status(400).json({ error: "Slot not available" });
    }

    // Create appointment
    const appointment = await Appointment.create({
      userId,
      slotId,
      contact,
      name
    }, { transaction });

    // Update slot availability
    await Slot.update(
      { is_available: false },
      { where: { id: slotId }, transaction }
    );

    await transaction.commit();
    res.json(appointment);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      error: "Booking failed",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Cancel appointment (authenticated)
router.delete("/:id", auth, async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Find and validate appointment
    const appointment = await Appointment.findOne({
      where: { id, userId },
      include: Slot,
      transaction
    });

    if (!appointment) {
      await transaction.rollback();
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Cancel appointment (soft delete)
    await appointment.update(
      { status: 'cancelled' },
      { transaction }
    );

    // Release slot
    await Slot.update(
      { is_available: true },
      { where: { id: appointment.slotId }, transaction }
    );

    await transaction.commit();
    res.json({ message: "Appointment cancelled successfully" });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      error: "Cancellation failed",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
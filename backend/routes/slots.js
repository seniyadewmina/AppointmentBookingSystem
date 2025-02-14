const express = require("express");
const { Slot } = require("../models");
const { isValidDate, formatDateToISO } = require("../utils/dateHelpers"); // Assume you have date helpers

const router = express.Router();

// 🟢 Get available slots for a specific date
router.get("/", async (req, res) => {
  try {
    const { date } = req.query;

    // Validate input
    if (!date) {
      return res.status(400).json({ 
        error: "Date parameter is required in YYYY-MM-DD format" 
      });
    }

    // Sanitize and validate date format
    const cleanDate = formatDateToISO(date.trim());
    if (!isValidDate(cleanDate)) {
      return res.status(400).json({ 
        error: "Invalid date format. Use YYYY-MM-DD" 
      });
    }

    // Prevent past date selection
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(cleanDate) < today) {
      return res.status(400).json({ 
        error: "Cannot select past dates" 
      });
    }

    // Get available slots with additional safety checks
    const slots = await Slot.findAll({
      where: { 
        date: cleanDate,
        is_available: true,
      },
      attributes: ['id', 'start_time', 'end_time'], // Only return necessary fields
      order: [['start_time', 'ASC']] // Order by time
    });

    if (slots.length === 0) {
      return res.status(404).json({ 
        message: "No available slots for this date" 
      });
    }

    res.json({
      date: cleanDate,
      availableSlots: slots,
      count: slots.length
    });

  } catch (error) {
    console.error("Slots Error:", error);
    res.status(500).json({ 
      error: "Failed to retrieve slots",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;